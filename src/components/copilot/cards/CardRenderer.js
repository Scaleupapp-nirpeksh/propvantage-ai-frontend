// File: src/components/copilot/cards/CardRenderer.js
// Routes card objects to the correct renderer by type

import React from 'react';
import MetricsCardRenderer from './MetricsCardRenderer';
import TableCardRenderer from './TableCardRenderer';
import ChartCardRenderer from './ChartCardRenderer';
import ListCardRenderer from './ListCardRenderer';
import AlertCardRenderer from './AlertCardRenderer';

const renderers = {
  metrics: MetricsCardRenderer,
  table: TableCardRenderer,
  chart_data: ChartCardRenderer,
  list: ListCardRenderer,
  alert: AlertCardRenderer,
};

const CardRenderer = ({ card }) => {
  const Renderer = renderers[card.type];
  if (!Renderer) return null;
  return <Renderer card={card} />;
};

export default CardRenderer;
