from rest_framework.decorators import api_view, parser_classes
from rest_framework import status
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
import arff

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

    # Normalizar atributos a lista de dicts: {name, type}
    attrs_normalized = []
    attr_names = []
    for a in attributes:
        if isinstance(a, (list, tuple)) and len(a) >= 1:
            name = a[0]
            atype = a[1] if len(a) >= 2 else None
        else:
            name = a
            atype = None
        attr_names.append(name)
        attrs_normalized.append({"name": name, "type": atype})

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

    return Response({
        "attributes": attrs_normalized,
        "rows_count": len(rows),
        "rows": rows
    }, status=status.HTTP_200_OK)
