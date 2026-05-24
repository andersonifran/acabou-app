export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
      <div className="text-7xl mb-6">📶</div>
      <h1 className="text-2xl font-black text-gray-900 mb-3">Sem conexão</h1>
      <p className="text-gray-500 text-base max-w-xs mx-auto leading-relaxed mb-8">
        Você está offline. Verifique sua internet e tente novamente.
        <br /><br />
        Se você já usou o app antes, alguns dados ainda funcionam sem internet.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="bg-green-600 text-white font-semibold px-8 py-3.5 rounded-2xl hover:bg-green-700 transition-colors"
      >
        Tentar novamente
      </button>
      <p className="text-xs text-gray-400 mt-8">Acabou? — funciona offline quando já foi acessado antes</p>
    </div>
  );
}
