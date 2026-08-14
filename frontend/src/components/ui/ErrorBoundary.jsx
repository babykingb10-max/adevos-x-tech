import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || "Something went wrong." };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary]", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-bg-dark px-6 text-center">
          <p className="font-display font-semibold text-brand-dark text-lg mb-2">Something went wrong</p>
          <p className="text-sm text-muted-dark font-body mb-6 max-w-sm">{this.state.message}</p>
          <button
            onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
            className="btn-primary text-sm"
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
