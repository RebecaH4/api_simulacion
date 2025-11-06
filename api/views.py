from rest_framework.decorators import api_view, parser_classes
from rest_framework import status
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.http import HttpResponse
import arff
import io
import pandas as pd
import zipfile
from sklearn.model_selection import train_test_split


def train_val_test_split(df, rstate=42, shuffle=True, stratify=None):
    strat = df[stratify] if stratify else None
    train_set, test_set = train_test_split(df, test_size=0.4, random_state=rstate, shuffle=shuffle, stratify=strat)
    
    strat = test_set[stratify] if stratify else None
    val_set, test_set = train_test_split(test_set, test_size=0.5, random_state=rstate, shuffle=shuffle, stratify=strat)
    return train_set, val_set, test_set
 
@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
def main(request):
    file = request.FILES.get('file')
    if not file:
        return Response({"error": "No se proporcionó ningún archivo under key 'file'"},
                        status=status.HTTP_400_BAD_REQUEST)

    # Leer todo el archivo una vez
    raw = file.read()
    # Lista de codificaciones a intentar
    encodings = ['utf-8', 'latin1', 'iso-8859-1', 'cp1252']
    last_error = None

    import re

    def _preprocess_arff_text(txt: str) -> str:
        """Normalizaciones que corrigen problemas comunes en ARFFs del dataset KDD.

        - Elimina espacios entre '{' y la primera comilla: "{ 'val'..." -> "{'val'..."
        - Elimina espacios entre coma y la siguiente comilla: ", 'val'" -> ", 'val'" (no cambia si ya correcto)
        - Elimina espacios antes de '}' dentro de listas nominales
        """
        # quitar espacios justo después de '{'
        txt = re.sub(r"\{\s+(['\"])", r"{\1", txt)
        # quitar espacios después de comas antes de comillas
        txt = re.sub(r",\s+(['\"])", r",\1", txt)
        # quitar espacios antes de '}' after quotes
        txt = re.sub(r"(['\"])\s+\}", r"\1}", txt)
        return txt

    data = None
    for encoding in encodings:
        try:
            if isinstance(raw, bytes):
                try:
                    text = raw.decode(encoding)
                except Exception as e:
                    last_error = e
                    continue
            else:
                text = raw

            # Preprocesar texto para normalizar nominal lists problemáticas
            text_proc = _preprocess_arff_text(text)

            try:
                data = arff.loads(text_proc)
                # registro de éxito para depuración
                print(f"Éxito al cargar usando arff.loads con codificación {encoding}")
                break
            except Exception as e:
                last_error = e
                print(f"arff.loads falló con {encoding}: {e}")
                continue

        except Exception as e:
            last_error = e
            continue

    if data is None:
        # No intentamos arff.load directo porque produce inconsistencias con tipos bytes/str.
        return Response({
            "error": "No se pudo parsear el archivo ARFF",
            "detail": f"Error de codificación/parseo: {str(last_error)}"
        }, status=status.HTTP_400_BAD_REQUEST)

    # Normalizar estructura de attributes y data
    original_attributes = []
    if isinstance(data, dict):
        attributes = data.get('attributes') or []
        rows_raw = data.get('data') or []
    else:
        try:
            attributes = data['attributes'] or []
        except Exception:
            attributes = []
        try:
            rows_raw = data['data'] or []
        except Exception:
            rows_raw = []

    # Extraer atributos del archivo ARFF original para mantener consistencia
    attr_names = []
    for a in attributes:
        if isinstance(a, (list, tuple)) and len(a) >= 1:
            original_attributes.append(a)
            attr_names.append(a[0])
        else: # Manejar caso donde el atributo es solo el nombre (ej. 'numeric')
            original_attributes.append((a, 'NUMERIC')) # Asumir NUMERIC si no hay tipo explícito
            attr_names.append(a)

    # Convertir filas a lista de objetos {attrName: value}
    rows = []
    for r in rows_raw:
        try:
            values = list(r)
        except Exception:
            continue
        obj = {}
        for i, name in enumerate(attr_names):
            val = values[i] if i < len(values) else None
            if isinstance(val, bytes):
                try:
                    val = val.decode('utf-8')
                except Exception:
                    pass
            obj[name] = val
        rows.append(obj)

    # Convertir a DataFrame de Pandas
    df = pd.DataFrame(rows, columns=attr_names)

    # Obtener el parámetro 'stratify' de la solicitud, si existe
    stratify_col = request.data.get('stratify')

    # Dividir el dataset
    train_df, val_df, test_df = train_val_test_split(df, stratify=stratify_col)
    
    # Función auxiliar para convertir DataFrame a string ARFF
    def df_to_arff_string(dataframe, relation_name, attributes):
        arff_data = {
            'relation': relation_name,
            'attributes': attributes,
            'data': dataframe.values.tolist()
        }
        return arff.dumps(arff_data)

    # Crear un archivo ZIP en memoria
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        # Convertir cada DataFrame a ARFF y añadirlo al ZIP
        zip_file.writestr("train_set.arff", df_to_arff_string(train_df, "train_set", original_attributes))
        zip_file.writestr("val_set.arff", df_to_arff_string(val_df, "val_set", original_attributes))
        zip_file.writestr("test_set.arff", df_to_arff_string(test_df, "test_set", original_attributes))

    # Preparar la respuesta para la descarga del archivo ZIP
    response = HttpResponse(zip_buffer.getvalue(), content_type='application/zip')
    response['Content-Disposition'] = 'attachment; filename="nsl_kdd_splits.zip"'
    
    return response
