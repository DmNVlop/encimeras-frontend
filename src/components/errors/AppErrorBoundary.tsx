import { Component, type ErrorInfo, type ReactNode } from "react";
import ServerErrorPage from "@/pages/errors/ServerErrorPage";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class AppErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Actualiza el estado para que el siguiente renderizado muestre la interfaz de repuesto
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return <ServerErrorPage errorCode="FRONTEND_CRASH" errorDetail={this.state.error?.message || "Error inesperado en tiempo de ejecución"} />;
    }

    return this.props.children;
  }
}

export default AppErrorBoundary;
