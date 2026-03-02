import React from "react";
import { Box } from "@mui/material";
import { CategoryFilter } from "@/pages/public/components/CategoryFilter";
import { MaterialsFilter } from "@/pages/public/components/MaterialsFilter";

interface MaterialFiltersProps {
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

export const MaterialFilters: React.FC<MaterialFiltersProps> = ({ categories, selectedCategory, onCategoryChange, searchTerm, onSearchChange }) => {
  return (
    <Box
      sx={{
        display: "flex",
        gap: 2,
        flexWrap: "wrap",
        justifyContent: "flex-end",
        width: "100%",
        maxWidth: 800,
      }}
    >
      <CategoryFilter categories={categories} selectedCategory={selectedCategory} onCategoryChange={onCategoryChange} />
      <Box sx={{ flexGrow: 1, minWidth: 250 }}>
        <MaterialsFilter searchTerm={searchTerm} onSearchChange={onSearchChange} />
      </Box>
    </Box>
  );
};
