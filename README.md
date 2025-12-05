# SOCNexus - Dashboard Unificado de Cibersegurança

Este projeto é um Painel de Operações de Segurança (SOC) que centraliza informações de várias ferramentas de segurança (Elastic, Defender, Tenable, OpenCTI) em uma única tela.

Ele foi desenhado para ser fácil de instalar, utilizando uma tecnologia chamada **Docker**, que "empacota" tudo o que o programa precisa para funcionar.

---

## 📋 Pré-requisitos (O que você precisa antes de começar)

Para rodar este projeto, você precisa apenas de **uma** ferramenta instalada no seu computador:

1.  **Docker Desktop**:
    * Se você ainda não tem, baixe e instale gratuitamente aqui: [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/)
    * **Importante**: Após instalar, abra o "Docker Desktop" e deixe-o rodando (você verá um ícone de baleia perto do relógio do Windows/Mac).

---

## 🚀 Passo a Passo de Instalação (Para Iniciantes)

Siga estes passos exatos para colocar o sistema no ar.

### Passo 1: Preparar os arquivos
1.  Você deve ter baixado um arquivo chamado `soc-nexus-project.zip`.
2.  Clique com o botão direito nele e escolha **"Extrair Tudo"** (ou "Unzip").
3.  Entre na pasta que foi criada após a extração. Você verá arquivos como `docker-compose.yml` e pastas como `backend` e `frontend`.

### Passo 2: Abrir o Terminal na pasta
1.  **No Windows**:
    * Entre na pasta extraída (onde está o arquivo `docker-compose.yml`).
    * Na barra de endereço lá no topo da janela (onde diz o caminho da pasta), clique, apague tudo, digite `cmd` e aperte **ENTER**.
    * Uma tela preta (Prompt de Comando) vai abrir já no local certo.
2.  **No Mac/Linux**:
    * Abra o Terminal.
    * Digite `cd ` (com um espaço no final) e arraste a pasta do projeto para dentro da janela do terminal. Aperte **ENTER**.

### Passo 3: Iniciar o Sistema
1.  Na tela preta (terminal), digite exatamente o seguinte comando e aperte **ENTER**:

    ```bash
    docker-compose up --build
    ```

2.  **Aguarde**. Várias linhas de texto vão aparecer. O Docker está baixando e instalando tudo automaticamente. Isso pode levar alguns minutos dependendo da sua internet.
3.  O processo terminou quando as mensagens pararem de correr rápido e o terminal ficar "parado" aguardando.

### Passo 4: Acessar o Dashboard
1.  Abra seu navegador de internet (Chrome, Edge, Firefox).
2.  Digite o seguinte endereço na barra de cima:

    ```
    http://localhost:3000
    ```

3.  Pronto! O painel deve carregar na sua tela.

---

## ⚙️ Como Configurar (Após instalar)

O painel vem com dados de "mentirinha" (simulação) para você ver como funciona. Para conectar com ferramentas reais:

1.  No menu lateral esquerdo do painel, clique em **Configurações** (ou no ícone de engrenagem).
2.  Preencha os campos com as chaves (API Keys) das suas ferramentas (Elastic, Tenable, etc.).
3.  Clique em **Salvar**.

---

## ❓ Problemas Comuns

* **Erro "docker não encontrado"**: Você não instalou o Docker Desktop ou não reiniciou o computador após instalar.
* **Erro "daemon not running"**: O Docker Desktop está instalado, mas não está aberto. Abra o programa "Docker Desktop" e espere o ícone da baleia parar de se mexer.
* **A página não carrega**: Verifique se o passo 3 completou sem erros vermelhos no terminal.
* **Erro ao baixar imagem do Docker Hub**: As imagens base agora usam o espelho `mirror.gcr.io` para evitar bloqueios no Docker Hub. Se o seu ambiente não conseguir acessar esse espelho, você pode alterar a origem durante o build com, por exemplo:

  ```bash
  docker-compose build \
    --build-arg PYTHON_IMAGE=python:3.9-slim \
    --build-arg NODE_IMAGE=node:18-alpine \
    --build-arg NGINX_IMAGE=nginx:alpine
  ```

  Ajuste os valores conforme o registro que você tem acesso.
