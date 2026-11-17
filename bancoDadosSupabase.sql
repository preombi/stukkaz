create table public.produtos (
  id uuid not null default gen_random_uuid (),
  categoria text not null,
  codigo text not null,
  nome text not null,
  preco numeric(12, 2) not null,
  quantidade integer not null,
  cadastrado boolean not null default true,
  constraint produtos_pkey primary key (id),
  constraint produtos_categoria_check check (
    (
      TRIM(
        both
        from
          categoria
      ) <> ''::text
    )
  ),
  constraint produtos_codigo_check check (
    (
      TRIM(
        both
        from
          codigo
      ) <> ''::text
    )
  ),
  constraint produtos_nome_check check (
    (
      TRIM(
        both
        from
          nome
      ) <> ''::text
    )
  ),
  constraint produtos_preco_check check ((preco >= (0)::numeric)),
  constraint produtos_quantidade_check check ((quantidade >= 0))
) TABLESPACE pg_default;

create unique INDEX IF not exists produtos_codigo_cadastrado on public.produtos using btree (
  lower(
    TRIM(
      both
      from
        codigo
    )
  )
) TABLESPACE pg_default
where
  cadastrado;

create table public.movimentos (
  id bigint generated always as identity not null,
  produto_id uuid not null,
  codigo text not null,
  nome text not null,
  tipo text not null,
  quantidade integer not null,
  data date not null default ((now() AT TIME ZONE 'America/Sao_Paulo'::text))::date,
  hora time without time zone not null default ((now() AT TIME ZONE 'America/Sao_Paulo'::text))::time without time zone,
  constraint movimentos_pkey primary key (id),
  constraint movimentos_produto_id_fkey foreign KEY (produto_id) references produtos (id),
  constraint movimentos_check check (
    (
      (
        tipo <> all (array['Entrada'::text, 'Saída'::text])
      )
      or (quantidade > 0)
    )
  ),
  constraint movimentos_quantidade_check check ((quantidade >= 0)),
  constraint movimentos_tipo_check check (
    (
      tipo = any (
        array[
          'Cadastro'::text,
          'Entrada'::text,
          'Saída'::text,
          'Edição'::text,
          'Apagar'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;
