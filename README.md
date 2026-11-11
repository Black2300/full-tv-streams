# Full TV Streams 🎬📺🍿

Uma plataforma moderna, veloz e elegante de streaming web para reproduzir **TV ao Vivo**, **Filmes** e **Séries** diretamente no navegador, totalmente pronta para hospedagem na **Vercel**.

![Full TV Streams](https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=1200&auto=format&fit=crop&q=80)

---

## 🚀 Recursos Principais

- 📺 **TV ao Vivo em Tempo Real**:
  - Reprodução instantânea de canais via HLS (`.m3u8`) com baixa latência usando `hls.js`.
  - Guia de canais por categorias (Jogos do Dia, Abertos, Notícias, Filmes & Séries, Esportes, etc.).
  - Alternador de canais (*zapping*) integrado diretamente dentro do player em tela cheia.
  - Indicador de status "AO VIVO" pulsante.

- 🎬 **Catálogo Completo de Filmes**:
  - Filtro por dezenas de categorias (Ação, Ficção Científica, Disney, Comédia, Terror, etc.).
  - Ordenação por: Mais Recentes, Melhor Avaliados e Ordem Alfabética (A-Z).
  - Modal com metadados detalhados: Sinopse, Elenco, Direção, Gêneros, Nota IMDb e Ano.
  - Player customizado com barra de progresso, avanço/retrocesso de 10s e controle de velocidade.

- 🍿 **Séries Organizadas por Temporadas & Episódios**:
  - Navegação por provedores e categorias (HBO Max, Netflix, Prime Video, Apple TV+, etc.).
  - Seletor de temporadas e lista de episódios com miniaturas, títulos e durações.
  - Botão de "Próximo Episódio" automático no player.

- 🌟 **Tela Inicial Detalhada (Estilo Netflix / Apple TV+)**:
  - **Banner Hero Cinemático**: Carrossel em destaque com os títulos mais populares, imagens em alta resolução, sinopses e botão de "Assistir Agora".
  - **Carrosséis por Categoria**: Rolagem horizontal suave com cards interativos e efeitos de foco.
  - **Continuar Assistindo**: Salva automaticamente o progresso e permite retomar de onde parou.
  - **Minha Lista / Favoritos**: Salve seus canais, filmes e séries favoritos com 1 clique (armazenado no `localStorage`).

- ⚡ **Otimizado para Vercel**:
  - Suporte completo a HTTPS para evitar bloqueios de conteúdo misto (*Mixed Content*).
  - Rota de API com cache em memória inteligente para navegação ultrarrápida.
  - Configuração `vercel.json` com headers CORS pré-configurados.

---

## 🛠️ Tecnologias Utilizadas

- **Next.js 15** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS**
- **Hls.js** (Reprodução de transmissões HLS `.m3u8` ao vivo)
- **Lucide React** (Ícones modernos)

---

## ⚙️ Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto (ou configure nas variáveis de ambiente da Vercel):

```env
NEXT_PUBLIC_IPTV_SERVER=https://fullagora.fun
NEXT_PUBLIC_IPTV_USERNAME=kettericasa
NEXT_PUBLIC_IPTV_PASSWORD=510272859
```

---

## 🚀 Como Executar Localmente

1. Clone o repositório:
```bash
git clone https://github.com/Black2300/full-tv-streams.git
cd full-tv-streams
```

2. Instale as dependências:
```bash
npm install
```

3. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

4. Abra no seu navegador:
```
http://localhost:3000
```

---

## ☁️ Como Hospedar na Vercel

1. Faça o commit e push para o repositório GitHub:
```bash
git add .
git commit -m "feat: site completo para streaming de filmes, series e tv ao vivo"
git push origin main
```

2. Acesse [vercel.com](https://vercel.com) e clique em **Add New Project**.
3. Selecione o repositório `full-tv-streams`.
4. Em **Environment Variables**, adicione (opcional, pois já possui valores padrão no código):
   - `NEXT_PUBLIC_IPTV_SERVER`: `https://fullagora.fun`
   - `NEXT_PUBLIC_IPTV_USERNAME`: `kettericasa`
   - `NEXT_PUBLIC_IPTV_PASSWORD`: `510272859`
5. Clique em **Deploy**! Em menos de 2 minutos seu site estará no ar com certificado SSL HTTPS gratuito.

---

## ⌨️ Atalhos do Player de Vídeo

| Tecla | Ação |
| :--- | :--- |
| **Espaço** | Reproduzir / Pausar |
| **Seta Direita (→)** | Avançar 10 segundos |
| **Seta Esquerda (←)** | Voltar 10 segundos |
| **Seta Cima (↑)** | Aumentar volume |
| **Seta Baixo (↓)** | Diminuir volume |
| **F** | Alternar Tela Cheia |
| **M** | Silenciar / Ativar Som |
| **Esc** | Fechar Player |
