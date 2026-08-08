# Pivôs do Esqueleto — v0.24.0

## Problema anterior

Rádio, ulna, tíbia e fíbula eram rotacionados diretamente.

Como o ponto de origem desses meshes não correspondia necessariamente ao centro anatômico da articulação, o movimento podia parecer uma rotação da peça inteira ao redor de seu próprio centro.

## Solução

`JointController` agora pode criar um grupo de pivô em tempo de execução.

Etapas:
1. localizar o mesh de referência articular;
2. calcular o centro do bounding box em coordenadas de mundo;
3. converter esse ponto para coordenadas locais do esqueleto;
4. criar um `THREE.Group`;
5. reparentar os ossos distais usando `attach()`;
6. aplicar o ângulo ao grupo.

Pivôs usados:
- left_elbow_joint;
- right_elbow_joint;
- left_knee_joint;
- right_knee_joint.

## Limite

O recurso melhora o ponto de rotação, mas não converte o modelo em rig anatômico profissional.

Não há:
- limites biomecânicos validados;
- tecidos moles;
- colisão articular;
- cinemática clínica.
