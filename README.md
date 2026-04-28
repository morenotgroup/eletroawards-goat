# EletroAwards GOAT 2026

Versão complementar emergencial para votação separada da categoria GOAT.

## Importante

- A base de CPFs foi mantida em `src/lib/data.ts`.
- A votação possui apenas 1 pergunta em `src/lib/awards.ts`.
- O prefixo do Redis é `eletroawards2026goat`, separado da plataforma principal.
- Não rode `FLUSHDB` no Redis principal da votação oficial.

## Variáveis no Vercel

```env
SESSION_SECRET=uma-chave-forte
ADMIN_TOKEN=um-token-admin-forte
KV_REST_API_URL=url-do-upstash
KV_REST_API_TOKEN=token-do-upstash
UPSTASH_REDIS_REST_URL=url-do-upstash
UPSTASH_REDIS_REST_TOKEN=token-do-upstash
```

## Alterar pergunta e indicados

Edite o arquivo:

```txt
src/lib/awards.ts
```

Troque `area`, `title` e os nomes dentro de `nominees`.
