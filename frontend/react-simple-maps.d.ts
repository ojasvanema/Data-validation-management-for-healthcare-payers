declare module 'react-simple-maps' {
    import React from 'react';

    export interface ComposableMapProps {
        projection?: string;
        projectionConfig?: {
            scale?: number;
            center?: [number, number];
            rotate?: [number, number, number];
        };
        width?: number;
        height?: number;
        style?: React.CSSProperties;
        children?: React.ReactNode;
    }
    export const ComposableMap: React.FC<ComposableMapProps>;

    export interface GeographiesProps {
        geography: string | object;
        children: (data: { geographies: any[] }) => React.ReactNode;
    }
    export const Geographies: React.FC<GeographiesProps>;

    export interface GeographyProps {
        geography: any;
        key?: string;
        fill?: string;
        stroke?: string;
        strokeWidth?: number;
        style?: {
            default?: React.CSSProperties;
            hover?: React.CSSProperties;
            pressed?: React.CSSProperties;
        };
        onMouseEnter?: (event: React.SyntheticEvent) => void;
        onMouseLeave?: (event: React.SyntheticEvent) => void;
        onMouseMove?: (event: React.SyntheticEvent) => void;
        onClick?: (event: React.SyntheticEvent) => void;
    }
    export const Geography: React.FC<GeographyProps>;

    export const Marker: React.FC<any>;
    export const Annotation: React.FC<any>;
    export const Graticule: React.FC<any>;
    export const Line: React.FC<any>;
    export const Sphere: React.FC<any>;
    export const ZoomableGroup: React.FC<any>;
}
