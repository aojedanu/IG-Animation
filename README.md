# IG-Animación

## Objetivo 
La meta de este trabajo es desarrollar una aplicación para la visualización de impactos en diferentes estructuras mediante el uso de la libreria de físicas ammo.js.
Los objetos que se demolerán con una esfera son: una torre, un muro, una piramide y un cubo. El lanzamiento es personalizable a traves de parametros como el angulo o la fuerza inicial.
Todos los parametros se podran configurar desde una GUI que incorpora la aplicación. 

## Flujo de la aplicación
En primera instancia la aplicación espera a que se carge la libreria ammo.js, una vez finalizado este rpoceso, se llama a la función init que se encargara de configurar el mundo físico, la escena de Three.js, el suelo, las estructuras, la esfera, la trayectoria, la interfaz gráfica y arrancar la animación.
para realizar esta tarea utiliza funciónes especifica de ammo.js como btDefaultCollisionConfiguration(), (que define las colisiones) btCollisionDispatcher(collisionConfiguration); (el dispatcher que se encarga de decidir qué objetos están colisionando y calcular los puntos de contacto), btDbvtBroadphase() ( que identifica rápidamente los pares de objetos cuyas cajas delimitadoras se superponen potencialmente) y btSequentialImpulseConstraintSolver() ( que resuelve las fuerzas, impulsos y choques reales entre los cuerpos)
con todos estos componentes se crea el mundo físico mediante el uso de la función btDiscreteDynamicsWorld(). Una vez realizado este proceso se inicializa la parte gráfica con la función initThree(), esta función crea la escena (scene = new THREE.Scene()), el fondo, al que asigna un color y añade niebla posteriormente crea y configura la camara para que se situe detras de la esfera (camera = new THREE.PerspectiveCamera(60, aspectRatio, 0.1, 1000); camera.position.set(0, 8, -30);), tambien se crea el renderer con antialiasing (renderer = new THREE.WebGLRenderer({ antialias: true });) y se ajusta el tamaño a la ventana del navegador finalmente se activa el orbitcontrol y se crean las luces de la escena (ambiental y direccional). 
tras la creacion de ambas partes se porcede a añadir cada elemento de la escena y el panel de control con las funciones:createGround(), createStructureByIndex(), createSphere(), createTrajectoryLine(), initGUI(). 
Finalmente se llama a la función animate(). El bucle animate en cada iteración actualiza la física, la trayectoria, la posición y renderiza la escena (updatePhysics(dt), updateTrajectory(),controls.update() yrenderer.render(scene, camera)).

### Funciones auxiliares 

#### createGround()
la función createGround() crea un plano físico y visual que actúa como el suelo del mundo mediante el uso de ammo.js de modo que los objetos puedan chocar sobre él.
Para conseguir esto primero se crea la forma del suelo (const groundGeo = new THREE.BoxGeometry(40, 1, 40)) y el metarial para qeu pueda interactuar con las luces (const groundMat = new THREE.MeshStandardMaterial({ color: 0x3a7d44 });
) tambien se debe crear el mesh y activar la opcion reciveshadow para que los objetos proyecten su sombraa sobre el (const ground = new THREE.Mesh(groundGeo, groundMat); ground.receiveShadow = true; scene.add(ground);).
La parte anteriormente descrita se corresponde al plano visual, para implementar las fisicas se debe de definir la zona de colisiones (const shape = new AmmoLib.btBoxShape(new AmmoLib.btVector3(20, 0.5, 20));) el tamaño debe de ser la mitad que el del mesh.
una vez definida la zona de colisiones hay que trasladarla a la posicion del suelo (const transform = new AmmoLib.btTransform();transform.setIdentity();transform.setOrigin(new AmmoLib.btVector3(0, -0.5, 0));) y crear un rigidbody al que se le pasan estos parametros y 0 (en masa) para indicar que es estatico (const rbInfo = new AmmoLib.btRigidBodyConstructionInfo(0, // masa = 0 motionState,shape,new AmmoLib.btVector3(0, 0, 0));)
finalmente se añade el cuerpo a la escena 

#### createBox()

La función createBox es el eje sobre el que se conotruyen las estrcutas a demolir. la función necesita una serie de parametros inciales: la posicion donde se colocara el cubo, el ancho, el alto, la profundida, el color y la masa que por defecto esta a 1 lo cual indica que es un cuerpo no estatico (createBox(x, y, z, sx, sy, sz, color, mass = 1)).
En primera instancia se crea la forma y el material (const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz),new THREE.MeshStandardMaterial({ color }));)  se posiciona el bloque sobre las coordenadas, se acivan las sombras y se añade a la escena. En cuanto a la parte fisica se vuevle a crear la forma (const shape = new AmmoLib.btBoxShape(new AmmoLib.btVector3(sx * 0.5, sy * 0.5, sz * 0.5));),  se sitia l fomra sobre el cubo y se calcula la inercia segun la masa (const localInertia = new AmmoLib.btVector3(0, 0, 0); shape.calculateLocalInertia(mass, localInertia);)
Mediante (const motionState = new AmmoLib.btDefaultMotionState(transform);) se permite que amoo actualize la posición del mesh en cada frame. Finalmente se crea el rigidbody, se añade a la escena y se guarda en un array (rigidBodies.push({ mesh, body });) para que updatePhysics()) los mantenga sincronizados.)

##### createTower()
La función createTower()
Crea una torre vertical de cubos mediante el uso de createBox().

##### createWall()
La función createWall() crea una pared rectangular de 6*6 bloques usando la función createBox().

##### createPyramid()

La función createPyramid crea una pirámide escalonada donde cad bloque es creado usando createBoxx().

##### createBigCube()

La función createBigCube crea un cubo grande de un solo bloque con createBox().

####  createSphere()
La función createSphere sigue el mismo flujo de creación que createBox pero ajust ciertos parametros para que se trate de una esfera en ve de un cubo (  const geo = new THREE.SphereGeometry(0.5, 32, 32);). 
tras la creacion visual de la misma y su añadido a la escena se crea la forma fisica (const shape = new AmmoLib.btSphereShape(radius);), se traslada a la posicion designada,  se calcula la incercia, se crea el cuerpo rigido y se añade a la escena y al array de objetos.

#### createTrajectoryLine()
Esta función trata de 



## Resultado 


### Video 








