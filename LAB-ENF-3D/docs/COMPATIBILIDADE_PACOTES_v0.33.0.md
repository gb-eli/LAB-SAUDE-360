# Compatibilidade de Pacotes — v0.33.0

## Objetivo

Evitar aplicar silenciosamente uma sessão que referencia sistemas, estruturas ou versões incompatíveis.

## Serviço

`ComparisonPackageCompatibilityManager`

## Bloqueios

Exemplos:
- schema incorreto;
- packageVersion não suportada;
- sistema A/B inexistente;
- estrutura A/B inexistente.

Se houver bloqueio:
`Aplicar pacote` fica desabilitado.

## Avisos

Exemplos:
- marcador cuja mesh não existe;
- categoria desconhecida;
- bloco opcional de estilos com schema desconhecido;
- bloco opcional de presets com schema desconhecido.

Avisos não necessariamente bloqueiam a aplicação da parte compatível.

## Compatibilidade retroativa

Pacotes da v0.32:
- mesmo schema;
- packageVersion 1.

Portanto continuam aceitos quando suas referências anatômicas existem.
