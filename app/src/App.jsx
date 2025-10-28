

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
  const [attributes, setAttributes] = useState([])
  const [allRows, setAllRows] = useState([])
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(50)
  const fileRef = useRef(null)
  const [fileName, setFileName] = useState('')
  const [showStats, setShowStats] = useState(false)

  // Calcular filas paginadas
  const rows = useMemo(() => {
    const start = (page - 1) * rowsPerPage
    return allRows.slice(start, start + rowsPerPage)
  }, [allRows, page, rowsPerPage])

  const totalPages = Math.ceil(allRows.length / rowsPerPage)

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
    formData.append('file', file)

    try {
      setLoading(true)
      const resp = await axios.post('https://api-simulacion.onrender.com/api/load', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json',
        },
        withCredentials: true
      })

      const data = resp.data
      setAttributes(data.attributes || [])
      setAllRows(data.rows || [])
      setPage(1)  // Reset a primera página
      setShowStats(true)
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
      darkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`}>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className={`rounded-lg shadow-xl overflow-hidden ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          {/* Header Banner */}
          <div className="px-8 py-12 bg-gradient-to-r from-[#1f2937] via-[#111827] to-[#0f172a] relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(37,99,235,0.15),transparent)]" />
        <div className="relative">
          <h2 className="text-3xl font-bold text-blue-400 mb-3 tracking-tight">
            Carga tu archivo ARFF
          </h2>
            </div>
          </div>

          {/* Upload Section */}
          <div className={`p-8 border-b ${
            darkMode ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className="max-w-xl mx-auto">
              <div className={`flex justify-center w-full h-32 px-4 transition ${
                darkMode 
                  ? 'bg-gray-50 border-gray-700 hover:border-gray-500' 
                  : 'bg-blue-900 border-gray-300 hover:border-gray-400'
              } border-2 border-dashed rounded-lg appearance-none cursor-pointer focus:outline-none`}>
                <div className="flex items-center space-x-2">
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".arff,text/*"
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
                        darkMode ? 'text-white' : 'text-blue-600'
                      }`}>
                        <svg className="animate-spin h-8 w-8" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                        </svg>
                        <span className="text-lg font-medium">Procesando archivo...</span>
                      </div>
                    ) : (
                      <>
                        <svg className={`w-8 h-8 mb-2 ${
                          darkMode ? 'text-gray-400' : 'text-gray-50'
                        }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <div className={`text-center ${
                          darkMode ? 'text-gray-300' : 'text-white'
                        }`}>
                          <span className="font-medium">Haz clic para subir</span> o arrastra y suelta
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
                    : 'bg-red-50 text-red-700 border border-red-200'
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

          {/* Table Section */}
          {rows.length > 0 && (
            <div className={`overflow-x-auto relative ${
              darkMode ? 'bg-gray-900' : 'bg-white'
            }`}>
              <div className="shadow-sm">
                <table className="min-w-full border border-collapse">
                  <thead className={
                    darkMode ? 'bg-gray-800/50' : 'bg-gray-50'
                  }>
                    <tr>
                      {attributes.map((a, index) => (
                        <th key={a.name} className={`sticky top-0 px-4 py-3.5 text-left text-xs font-medium uppercase tracking-wider border ${
                          darkMode 
                            ? 'text-gray-400 border-gray-700 bg-gray-800' 
                            : 'text-gray-500 border-gray-200 bg-gray-50'
                        }`}>
                          <div className="flex items-center space-x-1">
                            <span>{a.name}</span>
                            {a.type && (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${
                                darkMode 
                                  ? 'bg-gray-700 text-gray-300' 
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                {a.type}
                              </span>
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, idx) => (
                      <tr key={idx}>
                        {attributes.map((a) => (
                          <td key={a.name + idx} className={`px-4 py-3 text-sm border ${
                            darkMode 
                              ? 'border-gray-700 text-gray-300 hover:bg-gray-800' 
                              : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                          } ${
                            idx % 2 === 0
                              ? darkMode ? 'bg-gray-900' : 'bg-white'
                              : darkMode ? 'bg-gray-900/50' : 'bg-gray-50'
                          } ${
                            typeof r[a.name] === 'string' && r[a.name].length > 30
                              ? 'truncate max-w-xs'
                              : 'whitespace-nowrap'
                          }`}>
                            {r[a.name] === null || r[a.name] === undefined 
                              ? '-'
                              : typeof r[a.name] === 'object'
                                ? JSON.stringify(r[a.name])
                                : String(r[a.name])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className={`px-6 py-4 border-t ${
              darkMode 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-2">
                  <label className={`text-sm font-medium ${
                    darkMode ? 'text-gray-400' : 'text-gray-700'
                  }`}>
                    Mostrar
                  </label>
                  <select
                    value={rowsPerPage}
                    onChange={(e) => {
                      setRowsPerPage(Number(e.target.value))
                      setPage(1)
                    }}
                    className={`block w-full rounded-lg border text-sm focus:ring-2 focus:ring-offset-2 ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:ring-offset-gray-800' 
                        : 'bg-white border-gray-300 text-gray-700 focus:ring-blue-500 focus:ring-offset-white'
                    }`}
                  >
                    <option value={10}>10 filas</option>
                    <option value={25}>25 filas</option>
                    <option value={50}>50 filas</option>
                    <option value={100}>100 filas</option>
                  </select>
                </div>

                <div className="flex items-center justify-end space-x-2 sm:space-x-3">
                  <button
                    onClick={() => setPage(1)}
                    disabled={page === 1}
                    className={`relative inline-flex items-center p-2 rounded-lg text-sm font-medium transition-colors ${
                      darkMode
                        ? 'text-gray-400 hover:text-white hover:bg-gray-700 disabled:opacity-50'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-50'
                    }`}
                  >
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 010 1.414zm-6 0a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 011.414 1.414L5.414 10l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className={`relative inline-flex items-center p-2 rounded-lg text-sm font-medium transition-colors ${
                      darkMode
                        ? 'text-gray-400 hover:text-white hover:bg-gray-700 disabled:opacity-50'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-50'
                    }`}
                  >
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 011.414 1.414L8.414 10l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  <span className={`flex items-center gap-1 ${
                    darkMode ? 'text-gray-400' : 'text-gray-700'
                  }`}>
                    <span className="text-sm">Página</span>
                    <span className={`font-medium ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}>{page}</span>
                    <span className="text-sm">de</span>
                    <span className={`font-medium ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}>{totalPages}</span>
                  </span>

                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className={`relative inline-flex items-center p-2 rounded-lg text-sm font-medium transition-colors ${
                      darkMode
                        ? 'text-gray-400 hover:text-white hover:bg-gray-700 disabled:opacity-50'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-50'
                    }`}
                  >
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 15.707a1 1 0 001.414 0l5-5a1 1 0 000-1.414l-5-5a1 1 0 00-1.414 1.414L11.586 10l-4.293 4.293a1 1 0 000 1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setPage(totalPages)}
                    disabled={page === totalPages}
                    className={`relative inline-flex items-center p-2 rounded-lg text-sm font-medium transition-colors ${
                      darkMode
                        ? 'text-gray-400 hover:text-white hover:bg-gray-700 disabled:opacity-50'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-50'
                    }`}
                  >
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 15.707a1 1 0 001.414 0l5-5a1 1 0 000-1.414l-5-5a1 1 0 00-1.414 1.414L8.586 10 4.293 14.293a1 1 0 000 1.414zm6 0a1 1 0 001.414 0l5-5a1 1 0 000-1.414l-5-5a1 1 0 00-1.414 1.414L14.586 10l-4.293 4.293a1 1 0 000 1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
