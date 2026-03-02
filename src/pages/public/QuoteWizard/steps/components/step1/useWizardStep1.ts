import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuoteDispatch, useQuoteState } from "@/context/QuoteContext";
import { get } from "@/services/api.service";
import type { Material } from "@/interfases/materials.interfase";
import type { MaterialConfirmationPayload } from "@/context/QuoteInterfases";

export const useWizardStep1 = () => {
  const dispatch = useQuoteDispatch();
  const { wizardTempMaterial } = useQuoteState();

  const [materials, setMaterials] = useState<Material[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [materialForModal, setMaterialForModal] = useState<Material | null>(null);

  // Carga inicial de materiales
  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        setLoadingMaterials(true);
        const data = await get<Material[]>("/materials", {
          params: {
            fields: "name,category,imageUrl,selectableAttributes,_id",
          },
        });
        setMaterials(data);
      } catch (error) {
        console.error("Error al cargar materiales:", error);
      } finally {
        setLoadingMaterials(false);
      }
    };
    fetchMaterials();
  }, []);

  // Categorías únicas
  const uniqueCategories = useMemo(() => {
    const categories = materials.map((m) => m.category).filter(Boolean);
    return Array.from(new Set(categories));
  }, [materials]);

  // Filtrado de materiales
  const filteredMaterials = useMemo(() => {
    return materials.filter((mat) => {
      const lowerTerm = searchTerm.toLowerCase();
      const matchText = !searchTerm || mat.name.toLowerCase().includes(lowerTerm);
      const matchCategory = selectedCategory === "all" || mat.category === selectedCategory;
      return matchText && matchCategory;
    });
  }, [materials, searchTerm, selectedCategory]);

  const handleOpenModal = useCallback((material: Material) => {
    setMaterialForModal(material);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setMaterialForModal(null);
  }, []);

  const handleConfirmationFromModal = useCallback(
    (payload: MaterialConfirmationPayload) => {
      dispatch({ type: "SET_WIZARD_MATERIAL", payload });
      handleCloseModal();
    },
    [dispatch, handleCloseModal],
  );

  return {
    materials,
    loadingMaterials,
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    uniqueCategories,
    filteredMaterials,
    isModalOpen,
    materialForModal,
    wizardTempMaterial,
    handleOpenModal,
    handleCloseModal,
    handleConfirmationFromModal,
  };
};
