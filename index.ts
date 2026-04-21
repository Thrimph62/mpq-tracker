@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-[#0D0D0D] text-white font-sans;
    background-image:
      radial-gradient(ellipse at 20% 50%, rgba(230,36,41,0.04) 0%, transparent 60%),
      radial-gradient(ellipse at 80% 20%, rgba(192,132,252,0.04) 0%, transparent 60%);
  }
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { @apply bg-[#1A1A2E]; }
  ::-webkit-scrollbar-thumb { @apply bg-[#2D2D4E] rounded-full; }
}

@layer components {
  .card {
    @apply bg-[#1A1A2E] border border-[#2D2D4E] rounded-xl p-4;
  }
  .btn-primary {
    @apply bg-marvel-red hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors;
  }
  .btn-secondary {
    @apply bg-[#2D2D4E] hover:bg-[#3D3D6E] text-white px-4 py-2 rounded-lg transition-colors;
  }
  .input {
    @apply bg-[#0D0D0D] border border-[#2D2D4E] rounded-lg px-3 py-2 text-white
           placeholder-[#8888AA] focus:outline-none focus:border-marvel-red transition-colors w-full;
  }
  .badge {
    @apply text-xs font-semibold px-2 py-0.5 rounded-full;
  }
  .page-title {
    @apply font-marvel text-3xl tracking-wider text-marvel-gold;
  }
}
