# Guia de Instalação do Full TV Streams na Smart TV Samsung (Tizen OS)

Este guia explica detalhadamente como colocar o **Full TV Streams** na sua Smart TV Samsung como um **aplicativo nativo**, sem precisar ficar digitando o endereço no navegador toda vez.

---

## 📌 Por que o navegador da TV deu erro?

Quando você tentou pela TV:
1. **Não apareceu "Adicionar à tela inicial" no navegador da TV**: A Samsung **desabilitou a instalação de PWAs** no navegador de suas TVs (recurso presente apenas em celulares Android e PCs). O navegador da TV não permite instalar sites como apps diretamente por ele.
2. **"Informação: esta função não é suportada" ao tentar baixar**: As TVs Samsung (sistema Tizen) **não possuem gerenciador de downloads** por segurança contra malwares. Por isso, arquivos `.zip`, `.xml` ou `.wgt` **nunca devem ser baixados pela TV**, e sim pelo computador.

---

## 🚀 Método 1: Fixar na Barra Rápida da TV (Sem Computador - 1 Minuto)

Se você quer apenas um ícone que abra direto o aplicativo em tela cheia na sua TV sem usar computador:

1. Na TV Samsung, abra o aplicativo **Internet** (Navegador).
2. Acesse o seu site da Vercel (ex: `https://seu-projeto.vercel.app`).
3. No canto superior direito da tela do navegador da TV:
   - Clique no ícone de **Estrela (Favoritos)** ou no menu (três pontinhos / engrenagem).
   - Selecione a opção **"Fixar no Smart Hub"** (ou **"Adicionar à Barra Rápida"**).
4. Em seguida, clique nas **Configurações do Navegador da TV** (ícone de engrenagem) e marque:
   - **Ao Iniciar o Navegador:** selecione **"Abrir na Última Página"** ou defina o site como **"Página Inicial"**.
5. **Pronto!** Um atalho fica fixado na barra do Smart Hub da Samsung. Ao clicar nele, ele abre direto o Full TV Streams em tela cheia com os canais e filmes prontos para reproduzir!

---

## 💻 Método 2: Instalar o Aplicativo NATIVO (.wgt) pelo Computador

Para ter o aplicativo instalado com ícone próprio na grade de aplicativos da TV Samsung (como a Netflix e o YouTube):

### Passo 1: Ativar o Modo Desenvolvedor na Smart TV
1. Ligue a TV Samsung e verifique se ela está conectada na **mesma rede Wi-Fi que o seu computador**.
2. Abra a tela de **Apps** na TV.
3. No controle remoto físico da TV, digite a sequência numérica: **`1 2 3 4 5`** (se o seu controle for o moderno sem números, abra o teclado virtual de números na tela da TV).
4. Uma janela azul chamada **Developer Mode Configuration** vai se abrir na tela da TV.
5. Mude a chave para **ON**.
6. No campo **Host PC IP**, digite o endereço IP local do seu computador (você pode ver seu IP digitando `ipconfig` no terminal do Windows).
7. Clique em **OK**.
8. **Reinicie a TV:** Segure o botão Liga/Desliga do controle remoto por 5 segundos até a TV desligar e ligar mostrando o logotipo da Samsung. Ao ligar, haverá um aviso "Developer Mode" no topo da tela de Apps.

### Passo 2: Instalar o Aplicativo usando o TizenBrewInstaller
O TizenBrewInstaller é o programa gratuito mais usado para instalar aplicativos em TVs Samsung com interface simples:

1. No seu PC, baixe o instalador:
   👉 [TizenBrewInstaller para Windows (GitHub)](https://github.com/reisxd/TizenBrewInstaller/releases) (baixe o arquivo `.exe`).
2. Abra o programa no computador. Ele vai localizar a sua TV Samsung na rede Wi-Fi automaticamente (ou você pode digitar o IP da TV).
3. Selecione o arquivo **`FullTV.wgt`** que geramos na pasta do projeto e clique em **Install**.
4. O programa enviará o pacote para a TV em poucos segundos!

### Passo 3: Abrir na TV
O ícone do **Full TV Streams** aparecerá na linha de aplicativos baixados na TV Samsung. Basta abrir e desfrutar de toda a lista de canais, filmes e séries diretamente pelo controle remoto!
