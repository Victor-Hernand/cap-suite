import type { Company } from './types';

export const companiesIntro = {
  title: 'Un grupo, seis empresas',
  description:
    'Grupo Empresarial CAP es un conglomerado automotriz líder en Honduras. Cada empresa del grupo cubre un eslabón de la cadena: importación, distribución, venta al detalle, servicio e instalación, y logística.',
};

export const companies: Company[] = [
  {
    id: 'inversiones-sm',
    name: 'Inversiones S&M',
    segment: 'Importación y Distribución B2B',
    description:
      'Empresa líder en importación y distribución de autopartes en Honduras. Servicio personalizado con cobertura nacional, entregas rápidas y atención especializada a talleres, distribuidores y flotillas.',
    slogan: 'Ganando Tú, Ganamos Nosotros',
    color: '#C62828',
  },
  {
    id: 'mansiago',
    name: 'Distribuidora Mansiago',
    segment: 'Distribución de Lubricantes y Autopartes B2B',
    description:
      'Especializada en lubricantes, fluidos, filtros y autopartes de calidad. Se distingue por su confiabilidad, excelencia en servicio y respuesta inmediata con infraestructura eficiente.',
    slogan: 'Calidad que te impulsa',
    color: '#D4A843',
  },
  {
    id: 'blessing',
    name: 'Auto Repuestos Blessing',
    segment: 'Venta al Detalle B2C',
    description:
      'Referente nacional en la venta de autopartes al detalle, reconocido por su amplia variedad, precios accesibles y calidad. Servicio a domicilio y atención personalizada.',
    slogan: 'La calidad, no es cara',
    color: '#1E88E5',
  },
  {
    id: 'didasa',
    name: 'Tecnicentro DIDASA',
    segment: 'Instalación y Servicio Automotriz B2C',
    description:
      'Centro integral de mantenimiento, reparación e instalación de autopartes. Técnicos altamente capacitados con diagnóstico electrónico y mecánica general.',
    slogan: 'Tu vehículo en manos expertas',
    color: '#43A047',
  },
  {
    id: 'japan-hn',
    name: 'Japan HN',
    segment: 'Repuestos Japoneses B2B',
    description:
      'Especializada en repuestos japoneses de alta calidad. Marcas como KYB, 555, TRC, TZK, NPW, KOYO, MRK y FIC con garantía de calidad japonesa.',
    slogan: 'Calidad japonesa garantizada en cada pieza',
    color: '#E53935',
  },
  {
    id: 'cap-logistics',
    name: 'CAP Logistics',
    segment: 'Logística Especializada',
    description:
      'Gestiona la cadena de suministro del grupo, asegurando entregas oportunas y eficientes a nivel nacional e internacional con flota propia.',
    slogan: 'Eficiencia en cada entrega',
    color: '#7B1FA2',
  },
];
