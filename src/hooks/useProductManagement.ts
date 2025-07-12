// hooks/useProductManagement.ts
import { useState, useEffect, useRef } from "react";
import { Products } from "../service/interfaces";

export function useProductManagement(initialProducts: Products[]) {
  const [products] = useState<Products[]>(initialProducts);
  const [selectedProduct, setSelectedProduct] = useState<Products | null>(null);
  const [showKardexModal, setShowKardexModal] = useState(false);
  const [kardexProduct, setKardexProduct] = useState<Products | null>(null);
  const [contextMenu, setContextMenu] = useState({
    show: false,
    position: { x: 0, y: 0 },
    product: null as Products | null,
  });
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Handle F4 key for kardex
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F4" && selectedProduct) {
        setKardexProduct(selectedProduct);
        setShowKardexModal(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedProduct]);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(prev => ({ ...prev, show: false }));
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleProductClick = (product: Products) => {
    setSelectedProduct(product);
    setContextMenu(prev => ({ ...prev, show: false }));
  };

  const handleContextMenu = (e: React.MouseEvent, product: Products) => {
    e.preventDefault();
    setContextMenu({
      show: true,
      position: { x: e.clientX, y: e.clientY },
      product,
    });
  };

  const handleContextMenuAction = (action: string) => {
    if (!contextMenu.product) return;

    switch (action) {
      case "kardex":
        setKardexProduct(contextMenu.product);
        setShowKardexModal(true);
        break;
      case "view":
        alert(`Visualizando produto: ${contextMenu.product.name}`);
        break;
      case "location":
        alert(`Localização: ${contextMenu.product.location}`);
        break;
    }
    setContextMenu(prev => ({ ...prev, show: false }));
  };

  return {
    products,
    selectedProduct,
    showKardexModal,
    kardexProduct,
    contextMenu,
    contextMenuRef,
    handleProductClick,
    handleContextMenu,
    handleContextMenuAction,
    setShowKardexModal,
  };
}