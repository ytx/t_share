declare module 'react-split-pane' {
  import React, { Component, ReactNode } from 'react';

  interface SplitPaneProps {
    children: ReactNode;
    split?: 'vertical' | 'horizontal';
    minSize?: number;
    maxSize?: number;
    defaultSize?: string | number;
    onChange?: (size: number) => void;
    style?: React.CSSProperties;
    paneStyle?: React.CSSProperties;
    resizerStyle?: React.CSSProperties;
    className?: string;
    resizerClassName?: string;
    pane1ClassName?: string;
    pane2ClassName?: string;
  }

  export default class SplitPane extends Component<SplitPaneProps> {}
}