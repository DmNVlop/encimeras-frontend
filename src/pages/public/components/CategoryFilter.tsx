import React from "react";
import { FormControl, InputLabel, Select, MenuItem, type SelectChangeEvent } from "@mui/material";

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({ categories, selectedCategory, onCategoryChange }) => {
  const handleChange = (event: SelectChangeEvent) => {
    onCategoryChange(event.target.value);
  };

  return (
    <FormControl sx={{ minWidth: 200 }} size="medium">
      <InputLabel id="category-select-label">Categoría</InputLabel>
      <Select labelId="category-select-label" id="category-select" value={selectedCategory} label="Categoría" onChange={handleChange}>
        <MenuItem value="all">
          <em>Todas</em>
        </MenuItem>
        {categories.map((cat) => (
          <MenuItem key={cat} value={cat}>
            {cat}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};
