# Destaque Anatômico — v0.29.0

## Manager

`AnatomyHighlightManager`

## Técnica

O destaque utiliza duas camadas visuais:

### Material
Se o material possui `emissive`:
- guarda o valor original;
- adiciona emissão leve;
- aumenta `emissiveIntensity`;
- reduz discretamente `roughness`.

### Caixa espacial
Cria um `THREE.Box3Helper` ao redor das meshes correspondentes.

## Restauração

`clear()`:
- restaura emissive;
- restaura intensidade;
- restaura roughness;
- remove e descarta o Box3Helper.

## Uso

O manager não altera a geometria nem o conteúdo semântico.

É apenas um auxílio de localização.
