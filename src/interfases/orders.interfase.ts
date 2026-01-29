export interface OrderPreviewDrawerProps {
  open: boolean;
  onClose: () => void;
  order: any | null; // El objeto orden completo (con header y technicalSnapshot si lo tienes cargado)
  onApprove: (orderId: string) => void;
  onOpenDetail: (orderId: string) => void; // Para ir a la vista completa 3D
}
