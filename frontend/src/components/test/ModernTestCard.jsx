import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent, CyberButton } from '../ui';
import { SparklesIcon } from '@heroicons/react/24/outline';

export const ModernTestCard = () => {
  return (
    <Card className="p-6" delay={0.2}>
      <CardHeader>
        <CardTitle>Nuevo Sistema de Diseño Cyber</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-rambla-text-secondary mb-4">
          Sistema de diseño moderno con tema cyber implementado exitosamente.
        </p>
        <div className="flex gap-3">
          <CyberButton variant="primary" icon={<SparklesIcon className="w-4 h-4" />}>
            Botón Primario
          </CyberButton>
          <CyberButton variant="secondary">
            Botón Secundario
          </CyberButton>
          <CyberButton variant="ghost">
            Botón Ghost
          </CyberButton>
        </div>
      </CardContent>
    </Card>
  );
};
