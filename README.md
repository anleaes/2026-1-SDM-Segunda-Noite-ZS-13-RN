# Museu & Galeria — App React Native (Expo)

Aplicativo mobile do **Sistema de Gerenciamento de Museus e Galerias de Arte**, conectado 100% ao backend Django REST via HTTP/JSON.

- **Backend:** https://github.com/anleaes/2026-1-SDM-Segunda-Noite-ZS-13
- **Este repo (mobile):** https://github.com/anleaes/2026-1-SDM-Segunda-Noite-ZS-13-RN

---

## Visão geral da arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│  App React Native (este projeto)                            │
│                                                             │
│  app/          → telas (Expo Router = rotas por arquivo)    │
│  src/api/      → HTTP + chamadas à API                      │
│  src/context/  → login, sessão, permissões por perfil       │
│  src/components/ → UI reutilizável (botões, modais, etc.)   │
└──────────────────────────┬──────────────────────────────────┘
                           │  fetch (GET/POST/PATCH/DELETE)
                           ▼
              http://SEU_IP:8001/api/...
                           │
                           ▼
              Backend Django → Oracle Database
```

**Importante:** o app **nunca grava no banco diretamente**. Toda criação/edição/exclusão passa pela **API REST** do Django.

---

## Stack

| Tecnologia | Versão | Função |
|------------|--------|--------|
| **Expo SDK** | 54 | Framework mobile |
| **Expo Router** | 6 | Navegação (rotas = arquivos em `app/`) |
| **React Native** | 0.81 | UI nativa iOS/Android |
| **React** | 19 | Componentes |
| **TypeScript** | 5.9 | Tipagem |
| **AsyncStorage** | — | Persistir usuário logado no celular |

Sem Axios, sem Redux — usa `fetch` nativo + Context API.

---

## Estrutura de pastas

```
frontend/
├── app/                        # Telas (Expo Router — file-based routing)
│   ├── _layout.tsx             # Layout raiz + AuthProvider + Stack
│   ├── index.tsx               # Redireciona para login ou tabs
│   ├── login.tsx               # Tela de login
│   ├── register.tsx            # Cadastro de visitante
│   ├── admin.tsx               # CRUD funcionários/artistas (só admin)
│   ├── (tabs)/                 # Abas principais (após login)
│   │   ├── _layout.tsx         # Tab bar (Início, Galerias, Obras...)
│   │   ├── index.tsx           # Home — resumo do acervo
│   │   ├── galerias.tsx        # Lista + criar galeria
│   │   ├── obras.tsx           # Lista + cadastrar obra
│   │   ├── exposicoes.tsx      # Lista + criar exposição
│   │   ├── categorias.tsx      # CRUD categorias (funcionário)
│   │   └── perfil.tsx          # Perfil por papel + histórico
│   ├── galeria/[id].tsx        # Detalhe galeria (editar, abrir/fechar)
│   ├── obra/[id].tsx           # Detalhe obra (certificado, restauração)
│   └── exposicao/[id].tsx      # Detalhe exposição (ingresso, reserva...)
│
├── src/
│   ├── api/
│   │   ├── client.ts           # URL da API + fetch + ApiError
│   │   ├── services.ts         # Todas as funções (createGaleria, login...)
│   │   └── types.ts            # Interfaces TypeScript (Galeria, Obra...)
│   ├── context/
│   │   └── AuthContext.tsx     # Login, logout, flags de permissão
│   ├── components/
│   │   ├── ui.tsx              # Button, Card, Input, LoadingScreen...
│   │   └── forms.tsx           # FormModal, OptionPicker, StatusPicker
│   ├── theme/
│   │   └── colors.ts           # Cores e espaçamentos
│   └── utils/
│       └── format.ts             # formatDate, formatCurrency, statusLabel
│
├── .env                        # EXPO_PUBLIC_API_URL (não commitar IP real)
├── .env.example                # Modelo de configuração
├── app.json                    # Config Expo (nome, ícone, slug)
├── package.json
└── tsconfig.json               # Alias @/ → src/
```

---

## Como funciona a navegação (Expo Router)

O **caminho do arquivo = rota da tela**:

| Arquivo | Rota | Quem acessa |
|---------|------|-------------|
| `app/login.tsx` | `/login` | Todos (não logado) |
| `app/register.tsx` | `/register` | Visitante novo |
| `app/(tabs)/index.tsx` | `/` (aba Início) | Logado |
| `app/galeria/[id].tsx` | `/galeria/3` | Todos (detalhe) |
| `app/admin.tsx` | `/admin` | Só admin |

`(tabs)` = navegação por abas na parte inferior.  
`[id]` = parâmetro dinâmico (ID vindo da API).

---

## Camada `src/api/` — comunicação com o backend

### `client.ts` — HTTP base

- Lê `EXPO_PUBLIC_API_URL` do `.env`
- Fallback: IP do Expo no celular, ou `10.0.2.2` (Android emulador)
- Funções: `apiGet`, `apiPost`, `apiPatch`, `apiDelete`
- `ApiError` — erro amigável quando o backend está offline

```typescript
// Exemplo interno
fetch(`${API_URL}/galerias/`, { method: 'POST', body: JSON.stringify({ nome: 'MASP' }) })
```

### `services.ts` — regras de negócio da API

Cada função = um endpoint Django:

| Função | HTTP | Endpoint | Grava no banco? |
|--------|------|----------|-----------------|
| `loginUser()` | POST | `/auth/login/` | Não |
| `registerUser()` | POST | `/auth/register/` | Sim (via backend) |
| `fetchGalerias()` | GET | `/galerias/` | Não |
| `createGaleria()` | POST | `/galerias/` | Sim |
| `updateGaleria()` | PATCH | `/galerias/{id}/` | Sim |
| `deleteGaleria()` | DELETE | `/galerias/{id}/` | Sim |
| `comprarIngresso()` | POST | `/ingressos/` + `/pagamentos/` | Sim |
| `createCategoria()` | POST | `/categorias-obra/` | Sim |
| `createFuncionario()` | POST | `/funcionarios/` | Sim |

O app só **chama** essas funções; o Django grava no Oracle.

### `types.ts` — contratos TypeScript

Espelha os models do backend:

```typescript
interface Galeria {
  id: number;
  nome: string;
  descricao: string;
  endereco: string;
  aberta: boolean;
}
```

Não grava nada — só garante que o JSON está correto em compile-time.

---

## `AuthContext.tsx` — sessão e permissões

Guarda o usuário logado no **AsyncStorage** (`@museu_auth_user`).

| Flag | Quem | Controla no app |
|------|------|-----------------|
| `isVisitante` | visitante | Ingresso, reserva, avaliação |
| `isFuncionario` | funcionário | CRUD galerias/obras/exposições |
| `isArtista` | artista | Portfolio, vincular obras |
| `isAdmin` | admin | Painel admin + tudo de funcionário |
| `canStaff` | funcionário + admin | Botões de gestão nas telas |
| `canRestauracao` | funcionário + admin | Registrar restauração |

Exemplo nas telas:

```tsx
const { canStaff } = useAuth();
{canStaff && <Button label="+ Nova galeria" onPress={...} />}
```

---

## Telas e o que cada uma faz

### Autenticação

| Tela | Arquivo | API usada |
|------|---------|-----------|
| Login | `login.tsx` | `POST /auth/login/` |
| Cadastro | `register.tsx` | `POST /auth/register/` |

### Abas (tabs)

| Aba | Arquivo | Funcionalidades |
|-----|---------|-----------------|
| **Início** | `(tabs)/index.tsx` | Contagem galerias/obras/exposições |
| **Galerias** | `(tabs)/galerias.tsx` | Listar + criar (funcionário) |
| **Obras** | `(tabs)/obras.tsx` | Listar + cadastrar (funcionário) |
| **Exposições** | `(tabs)/exposicoes.tsx` | Listar + criar (funcionário) |
| **Categorias** | `(tabs)/categorias.tsx` | CRUD completo (funcionário) |
| **Perfil** | `(tabs)/perfil.tsx` | Histórico, relatório, portfolio |

### Detalhes (stack)

| Tela | Arquivo | Funcionalidades |
|------|---------|-----------------|
| Galeria | `galeria/[id].tsx` | Editar, abrir/fechar, excluir, criar exposição |
| Obra | `obra/[id].tsx` | Editar, certificado, restauração, excluir |
| Exposição | `exposicao/[id].tsx` | Editar, status, vincular obras, ingresso+pagamento, reserva, avaliação |
| Admin | `admin.tsx` | CRUD funcionários e artistas |

---

## Fluxo: criar galeria no app (exemplo completo)

```
1. Usuário (funcionário) toca "+ Nova galeria" em galerias.tsx

2. Preenche modal → salvarGaleria()

3. services.ts → createGaleria({ nome, endereco, descricao, aberta: true })

4. client.ts → POST http://IP:8001/api/galerias/  + JSON

5. Django (backend) → serializer → model.save() → Oracle

6. App recebe JSON da galeria criada → atualiza lista (load())
```

Mesma lógica para obra, exposição, ingresso, etc.

---

## Fluxo: visitante compra ingresso

```
exposicao/[id].tsx
  → escolhe método de pagamento (PIX/cartão/dinheiro)
  → comprarIngresso(visitanteId, exposicaoId, '60.00', metodo)
      → POST /ingressos/        (cria ingresso)
      → POST /pagamentos/       (registra pagamento pago)
  → histórico aparece em perfil.tsx
```

---

## Componentes reutilizáveis

### `src/components/ui.tsx`

| Componente | Uso |
|------------|-----|
| `Button` | Ações (primary, secondary, ghost) |
| `Card` | Blocos de conteúdo clicáveis |
| `Input` | Campos de formulário |
| `Badge` | Status (aberta, em andamento...) |
| `LoadingScreen` | Tela de carregamento |
| `ErrorState` | Erro + botão retry |
| `EmptyState` | Lista vazia |
| `ScreenHeader` | Título + subtítulo |

### `src/components/forms.tsx`

| Componente | Uso |
|------------|-----|
| `FormModal` | Modal slide-up com formulário |
| `OptionPicker` | Seleção horizontal (galeria, obra, categoria) |
| `StatusPicker` | Chips de status (planejada, em andamento...) |

---

## Alinhamento com o diagrama UML

| Perfil | Método UML | Onde no app |
|--------|------------|-------------|
| Visitante | `cadastro` | `register.tsx` |
| Visitante | `comprarIngresso` | `exposicao/[id].tsx` + pagamento |
| Visitante | `realizarReserva` | `exposicao/[id].tsx` + pagamento |
| Visitante | `avaliarExposicao` | `exposicao/[id].tsx` + editar no perfil |
| Funcionário | galerias + `cadastrarObra` | `galerias.tsx`, `obras.tsx` |
| Funcionário | `gerenciarExposicao` | `exposicoes.tsx`, `exposicao/[id].tsx` |
| Funcionário | `gerarRelatorio` | `perfil.tsx` (montado no cliente) |
| Funcionário | restaurações | `obra/[id].tsx`, `perfil.tsx` |
| Artista | `atualizarPortfolio` | `perfil.tsx` + vincular obras |
| Admin | gestão ampla | `admin.tsx` + permissões de funcionário |

---

## Configuração e execução

### 1. Instalar dependências

```bash
cd frontend
npm install
```

### 2. Configurar API

```bash
cp .env.example .env
```

Edite `.env` com o **IP da sua máquina** na rede Wi-Fi:

```env
EXPO_PUBLIC_API_URL=http://10.180.194.77:8001/api
```

> Use a porta em que o Django está rodando (`8000` ou `8001`).  
> Celular físico precisa estar na **mesma rede** que o Mac/PC.

### 3. Subir o backend (em outro terminal)

```bash
cd ..   # pasta A3
conda activate museu-galeria
python manage.py runserver 0.0.0.0:8001
```

### 4. Subir o app

```bash
npm start
```

Escaneie o QR code com **Expo Go** (Android/iOS).

---

## Usuários de teste

| Usuário | Senha | O que testar |
|---------|-------|--------------|
| `nathan.visitante` | `demo123` | Ingresso, reserva, cancelar, avaliar |
| `nathan.funcionario` | `demo123` | Galerias, obras, exposições, categorias |
| `nathan.artista` | `demo123` | Portfolio, vincular obras |
| `admin` | `admin123` | Painel admin (funcionários/artistas) |

Dados criados por `python manage.py seed_demo` no backend.

---

## O que o frontend **não** faz

| Item | Motivo |
|------|--------|
| Conectar no Oracle | Só o Django acessa o banco |
| Validar senha no servidor | Login é `POST /auth/login/` no backend |
| Armazenar senha | Só guarda dados do usuário logado (sem senha) |
| Funcionar offline | Precisa do backend rodando |

---

## Erros comuns

| Erro | Solução |
|------|---------|
| "Nao foi possivel conectar ao backend" | Django rodando? IP correto no `.env`? Mesma Wi-Fi? |
| Expo não carrega `.env` | Reinicie `npm start` após editar `.env` |
| Porta 8000 ocupada | Use `8001` no Django e no `.env` |
| Botões de gestão não aparecem | Logue como funcionário ou admin |

---

## Mapa mental para apresentação

> "O app React Native usa **Expo Router** — cada arquivo em `app/` é uma tela. A pasta `src/api/` centraliza todas as chamadas HTTP ao Django. O **AuthContext** controla quem vê o quê por perfil. O app não grava no banco: envia JSON para a API REST e o backend persiste no Oracle."

---

## Referência cruzada

Documentação do backend (models, serializers, Meta, museu_galeria):  
https://github.com/anleaes/2026-1-SDM-Segunda-Noite-ZS-13/blob/main/README.md
