

import { useState, useRef, useMemo, useEffect } from 'react'
import axios from 'axios'

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return false
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const fileRef = useRef(null)
  const [fileName, setFileName] = useState('')
  const [downloadUrl, setDownloadUrl] = useState(null)
  const [stratify, setStratify] = useState('protocol_type'); // Columna por defecto para estratificar


  const handleFile = async (e) => {
    setError(null)
    const file = e.target.files ? e.target.files[0] : null
    if (!file) return

    if (!file.name.toLowerCase().endsWith('.arff')) {
      setError('Solo se permiten archivos con extensión .arff')
      return
    }

    setFileName(file.name)
    const formData = new FormData()
    formData.append('file', file);
    formData.append('stratify', stratify);

    try {
      setLoading(true)
      setDownloadUrl(null) // Limpiar URL de descarga anterior
      const resp = await axios.post('https://api-simulacion.onrender.com/api/load', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
        },
        responseType: 'blob', // ¡Importante! Para manejar la descarga de archivos
      })

      // Crear una URL para el blob recibido y preparar para la descarga
      const url = window.URL.createObjectURL(new Blob([resp.data]));
      setDownloadUrl(url);

      // Iniciar la descarga automáticamente
      const link = document.createElement('a');
      link.href = url;
      const contentDisposition = resp.headers['content-disposition'];
      let downloadFileName = 'Proccess_Data.zip';
      if (contentDisposition) {
          const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
          if (fileNameMatch.length === 2) downloadFileName = fileNameMatch[1];
      }
      link.setAttribute('download', downloadFileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(err)
      setError(err?.response?.data?.error || err.message || 'Error al subir archivo')
    } finally {
      setLoading(false)
    }
  }

  // Efecto para escuchar cambios en el tema del sistema
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e) => setDarkMode(e.matches)
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      darkMode ? 'bg-white' : 'bg-gray-50'
    }`}>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className={`rounded-lg shadow-xl overflow-hidden ${
          darkMode ? 'bg-white' : 'bg-white'
        }`}>
          {/* Header Banner */}
          <div className="px-6 py-8 bg-gradient-to-r from-blue-400 to-pink-300 relative overflow-hidden">
            <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]" />
            <div className="relative">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
                Procedor de archivos ARFF
              </h2>
            </div>
          </div>

          {/* Upload Section */}
          <div className={`p-8 border-b ${
            darkMode ? 'border-white' : 'border-gray-200'
          }`}>
            <div className="max-w-xl mx-auto">
              <div className={`flex justify-center w-full h-32 px-4 transition ${
                darkMode 
                  ? 'bg-white border-white hover:border-gray-500' 
                  : 'bg-gray-50 border-gray-300 hover:border-gray-400'
              } border-2 border-dashed rounded-lg appearance-none cursor-pointer focus:outline-none`}>
                <div className="flex items-center space-x-2">
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".arff,.txt"
                    onChange={handleFile}
                    className="hidden"
                    id="file-upload"
                  />
                  <label 
                    htmlFor="file-upload" 
                    className="flex flex-col items-center justify-center"
                  >
                    {loading ? (
                      <div className={`flex items-center space-x-3 ${
                        darkMode ? 'text-blue-400' : 'text-blue-600'
                      }`}>
                        <svg className="animate-spin h-8 w-8" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                        </svg>
                        <span className="text-lg font-medium">Cargndo...</span>
                      </div>
                    ) : (
                      <>
                        <svg className={`w-8 h-8 mb-2 ${
                          darkMode ? 'text-withe' : 'text-pink-500'
                        }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <div className={`text-center ${
                          darkMode ? 'text-gray-900' : 'text-gray-900'
                        }`}>
                          <span className="font-medium">Subir Archivo</span>
                          <p className="text-xs mt-1">Solo archivos ARFF</p>
                        </div>
                      </>
                    )}
                  </label>
                </div>
              </div>
              {error && (
                <div className={`mt-4 p-4 rounded-lg flex items-center space-x-3 ${
                  darkMode 
                    ? 'bg-red-900/50 text-red-200 border border-red-800' 
                    : 'bg-red-50 text-red-700 border border-white'
                }`}>
                  <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" />
                  </svg>
                  <div className="flex-1 text-sm">
                    <p className="font-medium">Error al procesar el archivo</p>
                    <p>{error}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Download Section */}
          {downloadUrl && !loading && (
            <div className={`p-8 text-center ${
              darkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              <div className={`inline-flex items-center p-4 rounded-lg ${
                darkMode ? 'bg-indigo-700 text-white' : 'bg-white text-white'
              }`}>
                <svg className="w-6 h-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-medium">Archivo procesado</span>
              </div>
              <div className="mt-6">
                <a
                  href={downloadUrl}
                  download="Proccess_Data.zip"
                  className={`inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm transition-colors ${
                    darkMode
                      ? 'text-white bg-pink-600 hover:bg-pink-700'
                      : 'text-white bg-pink-600 hover:bg-pink-700'
                  }`}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Descargar de nuevo
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
