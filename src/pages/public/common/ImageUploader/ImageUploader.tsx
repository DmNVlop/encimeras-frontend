import React, { useState, useCallback } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import Cropper from "react-easy-crop";
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slider,
  CircularProgress,
  IconButton,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Stack,
  Alert,
  Collapse,
} from "@mui/material";
import axios from "axios"; // O tu apiService

import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteIcon from "@mui/icons-material/Delete";
import CropIcon from "@mui/icons-material/Crop";
import CropSquareIcon from "@mui/icons-material/CropSquare";
import Crop169Icon from "@mui/icons-material/Crop169";
import CropPortraitIcon from "@mui/icons-material/CropPortrait";
import CloseIcon from "@mui/icons-material/Close";
import { config } from "@/config";
import { resolveImageUrl } from "./utils/urlUtils";
import { getCroppedImg } from "./utils/imageUtils";

// Definimos las opciones de aspecto disponibles
type AspectOption = {
  value: number;
  label: string;
  icon?: React.ReactNode;
};

const DEFAULT_ASPECTS: AspectOption[] = [
  { value: 0, label: "Original", icon: <CropIcon fontSize="small" /> },
  { value: 1, label: "1:1", icon: <CropSquareIcon fontSize="small" /> },
  { value: 4 / 3, label: "4:3", icon: <CropPortraitIcon fontSize="small" sx={{ transform: "rotate(90deg)" }} /> },
  { value: 16 / 9, label: "16:9", icon: <Crop169Icon fontSize="small" /> },
  { value: 2 / 3, label: "2:3 (Vertical)", icon: <CropPortraitIcon fontSize="small" /> },
];

interface ImageUploaderProps {
  value?: string; // URL de la imagen actual
  onChange: (url: string) => void; // Callback cuando se sube ok
  availableAspects?: AspectOption[]; // Arreglo [Ej: 1 (Cuadrado), 16/9 (Landscape)]
  fixedAspect?: number; // Ej: 1 (Cuadrado), 16/9 (Landscape)
  maxSizeMB?: number;
  urlPrefix?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  value,
  onChange,
  availableAspects = DEFAULT_ASPECTS,
  fixedAspect,
  maxSizeMB = 5,
  urlPrefix = "",
}) => {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [currentAspect, setCurrentAspect] = useState<number>(fixedAspect || availableAspects[0]?.value || 0);
  const [naturalAspect, setNaturalAspect] = useState<number>(1);

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // 1. DROPZONE CONFIGURADO CON MANEJO DE ERRORES
  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      setError(null);

      if (fileRejections.length > 0) {
        const rejection = fileRejections[0];
        const { code } = rejection.errors[0];

        switch (code) {
          case "file-too-large":
            setError(`El archivo es demasiado grande. Máximo permitido: ${maxSizeMB}MB.`);
            break;
          case "file-invalid-type":
            setError("Tipo de archivo no válido. Solo se permiten imágenes (.jpeg, .png, .webp).");
            break;
          case "too-many-files":
            setError("Solo puedes subir una imagen a la vez.");
            break;
          default:
            setError(`Error al subir: ${rejection.errors[0].message}`);
        }
        return;
      }

      const file = acceptedFiles[0];
      if (file) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          setSelectedFile(reader.result as string);
          setIsModalOpen(true);
          setZoom(1);
          if (!fixedAspect) setCurrentAspect(availableAspects[0]?.value || 1);
        };
        reader.onerror = () => {
          setError("Error al leer el archivo. Inténtalo de nuevo.");
        };
      }
    },
    [availableAspects, fixedAspect, maxSizeMB],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpeg", ".jpg", ".png", ".webp"] },
    maxSize: maxSizeMB * 1024 * 1024,
    multiple: false,
  });

  // CROP LOGIC
  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Se ejecuta cuando la imagen carga en el Cropper
  const onMediaLoaded = useCallback((mediaSize: { width: number; height: number }) => {
    const ratio = mediaSize.width / mediaSize.height;
    setNaturalAspect(ratio);

    // OPCIONAL: Si quieres que al cargar SIEMPRE se ponga en modo "Original" automáticamente:
    // setCurrentAspect(0);
  }, []);

  const handleSaveCrop = async () => {
    if (!selectedFile || !croppedAreaPixels) return;
    setError(null);

    try {
      setIsUploading(true);

      // 1. INTELIGENCIA DE FORMATO
      // Intentamos determinar el formato original para mantenerlo (ej: si subió PNG, mantenemos PNG)
      // Si selectedFile es base64: "data:image/png;base64,..."
      // Si es URL: "blob:..." o "http://.../img.png"
      let targetMimeType = "image/jpeg"; // Default

      if (selectedFile.startsWith("data:")) {
        targetMimeType = selectedFile.substring(5, selectedFile.indexOf(";"));
      } else if (/\.png$/i.test(selectedFile)) {
        targetMimeType = "image/png";
      } else if (/\.webp$/i.test(selectedFile)) {
        targetMimeType = "image/webp";
      }

      // 2. GENERACIÓN DEL BLOB
      // Pasamos el tipo deseado al canvas.
      const croppedBlob = await getCroppedImg(selectedFile, croppedAreaPixels, targetMimeType);

      // 3. PREPARACIÓN DEL UPLOAD
      // Leemos la "verdad" del blob generado
      const finalMimeType = croppedBlob.type; // ej: "image/png"
      const extension = finalMimeType.split("/")[1] || "jpg";
      const fileName = `upload.${extension}`;

      const formData = new FormData();
      formData.append("file", croppedBlob, fileName);

      const uploadUrl = `${config.api.baseURL}/assets/upload`;

      // 4. PETICIÓN
      const response = await axios.post(uploadUrl, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const serverPath = response?.data?.url;

      if (!serverPath) {
        throw new Error("La respuesta del servidor no contiene una URL válida.");
      }

      // 5. RESOLUCIÓN DE URL (Lógica Cloud vs Local)
      const finalUrl = resolveImageUrl(serverPath, urlPrefix);

      onChange(finalUrl);
      handleClose();
    } catch (e: any) {
      console.error("Error uploading", e);
      const msg = e.response?.data?.message || e.message || "Error inesperado al procesar la imagen.";
      setError(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setIsModalOpen(false);
  };

  const handleAspectChange = (_event: React.MouseEvent<HTMLElement>, newAspect: number | null) => {
    if (newAspect !== null) {
      setCurrentAspect(newAspect);
    }
  };

  return (
    <Box>
      {/* PREVIEW O DROPZONE */}
      {value ? (
        <Paper
          variant="outlined"
          sx={{
            position: "relative",
            width: 150,
            height: 150,
            overflow: "hidden",
            borderRadius: 2,
            border: "1px solid #ddd",
            backgroundImage: `url(${value})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            "&:hover .actions": { opacity: 1 },
          }}
        >
          <Box
            className="actions"
            sx={{
              position: "absolute",
              inset: 0,
              bgcolor: "rgba(0,0,0,0.5)",
              opacity: 0,
              transition: "opacity 0.2s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconButton
              onClick={() => {
                onChange("");
                setError(null);
              }}
              sx={{ color: "white" }}
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        </Paper>
      ) : (
        <Box
          {...getRootProps()}
          sx={{
            border: "2px dashed #ccc",
            borderRadius: 2,
            p: 3,
            textAlign: "center",
            cursor: "pointer",
            bgcolor: isDragActive ? "#f0f8ff" : "#fafafa",
            transition: "all 0.2s",
            "&:hover": { borderColor: "primary.main", bgcolor: "#f5f9ff" },
          }}
        >
          <input {...getInputProps()} />
          <CloudUploadIcon
            sx={{
              fontSize: 40,
              color: error ? "error.main" : "text.secondary",
              mb: 1,
            }}
          />
          <Typography variant="body2" color={error ? "error.main" : "text.secondary"}>
            {isDragActive ? "Suelta la imagen..." : "Subir Imagen"}
          </Typography>
          {!error && (
            <Typography variant="caption" color="text.disabled" display="block">
              Máx {maxSizeMB}MB
            </Typography>
          )}
        </Box>
      )}

      {/* FEEDBACK DE ERROR */}
      <Collapse in={!!error}>
        <Alert severity="error" sx={{ mt: 1, borderRadius: 1 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      </Collapse>

      {/* MODAL DE RECORTE */}
      <Dialog open={isModalOpen} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          Ajustar Recorte
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ height: 500, display: "flex", flexDirection: "column", gap: 2 }}>
          <Box
            sx={{
              position: "relative",
              flexGrow: 1,
              minHeight: 300,
              bgcolor: "#333",
              borderRadius: 1,
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {selectedFile && (
              // NOTA: En tu entorno local descomenta <Cropper> y elimina el <Box> de aviso
              <Cropper
                image={selectedFile}
                crop={crop}
                zoom={zoom}
                aspect={currentAspect === 0 ? naturalAspect : currentAspect}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
                onMediaLoaded={onMediaLoaded}
              />
              // <Box sx={{ color: "white", textAlign: "center", p: 3 }}>
              //   <Typography variant="h6">Librería 'react-easy-crop' no cargada en Preview</Typography>
              //   <Typography variant="body2">Descomenta el código en tu editor local para ver el recortador.</Typography>
              //   <img src={selectedFile} alt="Preview raw" style={{ maxWidth: "100%", maxHeight: 200, marginTop: 16, opacity: 0.5 }} />
              // </Box>
            )}
          </Box>

          <Stack spacing={2} sx={{ mt: 1 }}>
            {!fixedAspect && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Typography variant="caption" sx={{ minWidth: 60 }}>
                  Formato:
                </Typography>
                <ToggleButtonGroup value={currentAspect} exclusive onChange={handleAspectChange} size="small">
                  {availableAspects.map((option) => (
                    <ToggleButton key={option.value} value={option.value}>
                      {option.icon}
                      <Box component="span" sx={{ ml: option.icon ? 1 : 0 }}>
                        {option.label}
                      </Box>
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </Box>
            )}

            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Typography variant="caption" sx={{ minWidth: 60 }}>
                Zoom:
              </Typography>
              <Slider value={zoom} min={1} max={3} step={0.1} onChange={(_e, z) => setZoom(Number(z))} sx={{ flexGrow: 1 }} />
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} color="inherit">
            Cancelar
          </Button>
          <Button
            onClick={handleSaveCrop}
            variant="contained"
            disabled={isUploading}
            startIcon={isUploading ? <CircularProgress size={20} color="inherit" /> : <CropIcon />}
          >
            {isUploading ? "Procesando..." : "Recortar y Subir"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
