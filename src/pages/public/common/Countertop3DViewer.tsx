import React, { useEffect, useRef } from "react";
import { Engine, Scene, ArcRotateCamera, Vector3, HemisphericLight, MeshBuilder, StandardMaterial, Texture, Color3 } from "@babylonjs/core";
import { Box, Typography } from "@mui/material";
import type { MainPiece } from "../../../context/QuoteContext";

interface Countertop3DViewerProps {
  mainPieces: MainPiece[];
  materialImage: string | undefined;
}

export const Countertop3DViewer: React.FC<Countertop3DViewerProps> = ({ mainPieces, materialImage }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // --- 1. SETUP MOTOR ---
    const engine = new Engine(canvasRef.current, true);
    const scene = new Scene(engine);
    scene.clearColor = new Color3(0.98, 0.98, 0.98).toColor4();

    // --- 2. CÁMARA ---
    const camera = new ArcRotateCamera(
      "camera1",
      -Math.PI / 2, // Mirando desde el "Sur" (frente)
      Math.PI / 3, // 60 grados desde arriba
      3.5,
      Vector3.Zero(),
      scene,
    );
    camera.attachControl(canvasRef.current, true);
    camera.wheelPrecision = 50;
    camera.lowerRadiusLimit = 0.5;
    camera.panningSensibility = 500;

    // --- 3. LUZ ---
    const light = new HemisphericLight("light1", new Vector3(0, 1, 0), scene);
    light.intensity = 1.0;

    // new AxesViewer(scene, 0.5); // Debug: Ejes

    // --- 4. MATERIAL ---
    const countertopMat = new StandardMaterial("countertopMat", scene);
    if (materialImage) {
      const texture = new Texture(materialImage, scene);
      texture.uScale = 2;
      texture.vScale = 2;
      countertopMat.diffuseTexture = texture;
      countertopMat.specularColor = new Color3(0.05, 0.05, 0.05);
    } else {
      countertopMat.diffuseColor = new Color3(0.85, 0.85, 0.85);
    }

    // --- 5. ALGORITMO DE DIBUJO CON CORRECCIÓN DE UNIONES ---

    // A. Ordenar piezas
    const sortedPieces = [...mainPieces].sort((a, b) => {
      const orderA = a.layout?.order ?? 0;
      const orderB = b.layout?.order ?? 0;
      return orderA - orderB;
    });

    // B. Estado del "Cursor" (La tortuga que recorre la PARED trasera)
    let cursorPosition = Vector3.Zero();

    // C. Guardar info de la pieza anterior para calcular colisiones en esquinas
    let previousPieceWidth = 0;

    // Acumuladores para centrar la cámara
    let totalCenterX = 0;
    let totalCenterZ = 0;

    sortedPieces.forEach((piece, index) => {
      // -- 1. Datos Básicos --
      const fullLength = piece.measurements.length_mm / 1000; // Longitud TOTAL de pared
      const width = piece.measurements.width_mm / 1000; // Profundidad
      const thickness = 0.04;

      const layout = piece.layout || { rotation: 0, connectionType: "NONE", jointType: "BUTT" };

      // -- 2. Vectores de Dirección --
      // Rotación: 0 = Derecha (X+), 90 = Fondo (Z+)
      // Convertimos a radianes.
      const rotRadians = (layout.rotation * Math.PI) / 180;

      // Vector Pared (Hacia dónde avanza la encimera longitudinalmente)
      const direction = new Vector3(Math.cos(rotRadians), 0, Math.sin(rotRadians));

      // Vector Interior (Hacia dónde "crece" la profundidad de la encimera desde la pared)
      // Cruzamos UP (0,1,0) con Direction. Esto da el vector a la "Derecha" del avance.
      // Asumimos que la línea que dibujamos es el borde EXTERIOR/TRASERO.
      const inwardVector = Vector3.Cross(new Vector3(0, 1, 0), direction).normalize();

      // -- 3. CÁLCULO DE RECORTE (OFFSET) PARA UNIÓN --
      // Si esta pieza es una esquina y es de tipo BUTT,
      // debe empezar DESPUÉS de donde termina el ancho de la anterior para no solaparse.

      let startOffset = 0;

      const isCorner = layout.connectionType === "CORNER_LEFT" || layout.connectionType === "CORNER_RIGHT";
      const isButtJoint = layout.jointType === "BUTT";

      if (index > 0 && isCorner && isButtJoint) {
        // ¡AQUÍ ESTÁ EL FIX!
        // Empujamos el inicio visual de la pieza una distancia igual al ANCHO de la anterior.
        startOffset = previousPieceWidth;
      }

      // La longitud visual del bloque será la longitud total MENOS el recorte.
      // Si la pieza mide 1200 de pared, y la anterior tenía 600 de ancho,
      // esta pieza visualmente mide 600.
      const visualLength = Math.max(0.01, fullLength - startOffset);

      // -- 4. POSICIONAMIENTO VISUAL --

      // A. Calcular el PUNTO DE INICIO VISUAL
      // Es el cursor (esquina pared) + desplazamiento en la dirección de la pared
      const visualStartPoint = cursorPosition.add(direction.scale(startOffset));

      // B. Calcular el CENTRO GEOMÉTRICO de la caja visual
      // Desde el inicio visual, avanzamos mitad del largo visual + mitad del ancho hacia adentro
      const centerPosition = visualStartPoint.add(direction.scale(visualLength / 2)).add(inwardVector.scale(width / 2));

      // -- 5. CREAR MESH --
      const box = MeshBuilder.CreateBox(
        `piece-${index}`,
        {
          width: visualLength, // Usamos la longitud recortada
          height: thickness,
          depth: width,
        },
        scene,
      );

      box.material = countertopMat;
      box.position = centerPosition;
      // Rotación negativa en Y para alinear con Babylon
      box.rotation.y = -rotRadians;

      // -- 6. ACTUALIZAR ESTADO PARA LA SIGUIENTE --

      // ¡IMPORTANTE!: El cursor de pared avanza la longitud TOTAL (de pared),
      // independientemente de si recortamos visualmente la pieza o no.
      cursorPosition = cursorPosition.add(direction.scale(fullLength));

      // Guardamos el ancho de esta pieza para que la siguiente sepa cuánto desplazarse
      previousPieceWidth = width;

      // Datos para cámara
      totalCenterX += centerPosition.x;
      totalCenterZ += centerPosition.z;
    });

    // --- 7. CÁMARA TARGET ---
    if (sortedPieces.length > 0) {
      const target = new Vector3(totalCenterX / sortedPieces.length, 0, totalCenterZ / sortedPieces.length);
      camera.setTarget(target);
    }

    engine.runRenderLoop(() => {
      scene.render();
    });

    const handleResize = () => engine.resize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      scene.dispose();
      engine.dispose();
    };
  }, [mainPieces, materialImage]);

  return (
    <Box sx={{ width: "100%", height: "100%", position: "relative", bgcolor: "#f5f5f5" }}>
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%", outline: "none" }} />
      <Box
        sx={{
          position: "absolute",
          bottom: 10,
          left: "50%",
          transform: "translateX(-50%)",
          bgcolor: "rgba(255,255,255,0.9)",
          px: 2,
          py: 0.5,
          borderRadius: 4,
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
      >
        <Typography variant="caption" fontWeight="bold">
          Vista 3D
        </Typography>
      </Box>
    </Box>
  );
};
