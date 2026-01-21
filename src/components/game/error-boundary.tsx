'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { useGameStore } from '@/lib/stores/game-store';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class GameErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Game Error Boundary caught error:', error, errorInfo);
    // Log to store if needed
    // useGameStore.getState().setError(error.message); // Can't use hooks in lifecycle outside
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-300">
          <div className="mb-6 rounded-full bg-destructive/10 p-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>
          <h2 className="mb-2 text-2xl font-bold tracking-tight">Game Application Error</h2>
          <p className="mb-6 max-w-md text-muted-foreground">
            Something went wrong while running the game. We've logged this issue.
          </p>
          <div className="flex gap-4">
            <Button 
              variant="outline" 
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
            >
              Refresh Page
            </Button>
            <Button 
              onClick={() => {
                this.setState({ hasError: false });
                window.location.href = '/arena';
              }}
            >
              Back to Arena
            </Button>
          </div>
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-8 max-w-lg rounded-md bg-muted p-4 text-left font-mono text-xs text-muted-foreground overflow-auto">
              {this.state.error?.toString()}
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
