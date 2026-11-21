import type {
  PolicyContentInput,
  PolicyGuideline,
  PolicyVersion,
  PublishInput,
} from '../src/lib/policies';
import type { PolicyClassification, PolicyStatus, PolicyType } from '../src/data/policies';
import type { FormatInput, LinkInput, NoticeInput, ProcessInput } from '../src/lib/departmentContent';

/** Datos de ejemplo tomados del mockup del Centro de Políticas. El seed las deja publicadas sin documento oficial. */
export interface SeedPolicy {
  content: PolicyContentInput;
  publication: PublishInput;
}

interface CatalogEntry {
  title: string;
  department: string;
  type: PolicyType;
  classification: PolicyClassification;
  status: PolicyStatus;
  version: string;
  effectiveDate: string;
  nextReviewDate: string;
  owner: string;
  summary: string;
  objective: string;
  indicators: string;
  relatedDocuments: string;
  guidelines: PolicyGuideline[];
  previousVersions: PolicyVersion[];
  changeReason: string;
}

function catalogPolicy(entry: CatalogEntry): SeedPolicy {
  return {
    content: {
      title: entry.title,
      department: entry.department,
      type: entry.type,
      classification: entry.classification,
      status: entry.status,
      summary: entry.summary,
      objective: entry.objective,
      scope: `Aplica a todo el personal que interviene en los procesos de ${entry.department} y a las áreas que les solicitan servicio.`,
      indicators: entry.indicators,
      relatedDocuments: entry.relatedDocuments,
      owner: entry.owner,
      approver: 'Gerencia Administrativa',
      nextReviewDate: entry.nextReviewDate,
      officialFilePath: null,
      guidelines: entry.guidelines,
      attachments: [],
      versions: entry.previousVersions,
    },
    publication: {
      version: entry.version,
      effectiveDate: entry.effectiveDate,
      author: entry.owner,
      reason: entry.changeReason,
    },
  };
}

const virtualMeetingsPolicy: SeedPolicy = {
  content: {
  title: 'Políticas de Reuniones Virtuales con Gerencia Administrativa',
  department: 'Gerencia Administrativa',
  type: 'policy',
  classification: 'internal',
  status: 'active',
  summary:
    'Toda reunión virtual del equipo se convoca por una sola persona designada, se graba obligatoriamente y se cierra correctamente para que quede respaldada en la plataforma institucional.',
  objective:
    'Establecer un marco normativo que ordene la programación, ejecución y resguardo de las reuniones virtuales del equipo, garantizar un orden claro en la convocatoria, evitar duplicidad de accesos y asegurar que todas las sesiones queden documentadas en la plataforma institucional.',
  scope:
    'Observancia obligatoria para todos los colaboradores que participen, convoquen o administren reuniones virtuales del equipo, así como las áreas que intervengan en su planificación, ejecución y resguardo.',
  indicators: '% de reuniones grabadas · % de cierres correctos · tiempo de publicación de la grabación.',
  relatedDocuments: 'Política de Comunicación y Gestión de Cambios · Protocolo de resguardo documental',
  owner: 'Moisés Cálix — Coord. Administrativo',
  approver: 'Gerencia Administrativa',
  nextReviewDate: '2027-06-02',
  officialFilePath: null,
  guidelines: [
    {
      title: 'Gestión y control de enlaces',
      body: 'La convocatoria está centralizada en una única persona autorizada. Se designa a Moisés como persona delegada por la Gerencia Administrativa; ninguna otra persona generará enlaces ni programará sesiones paralelas sin autorización expresa.',
    },
    {
      title: 'Grabación obligatoria',
      body: 'Toda reunión virtual debe grabarse sin excepción. Quien convoca o administra la sesión debe activar la grabación al inicio y verificar que permanezca activa todo el desarrollo.',
    },
    {
      title: 'Protocolo de cierre',
      body: 'Al concluir, todos los participantes deben finalizar la sesión correctamente y retirarse de la sala. No se permite abandonar la sesión dejándola activa.',
    },
  ],
  attachments: [
    {
      kind: 'link',
      label: 'SharePoint · Grabaciones de reuniones del equipo',
      url: 'https://example.com/sharepoint/grabaciones-reuniones',
      filePath: null,
    },
    {
      kind: 'video',
      label: 'Cápsula de 2 min: cómo convocar una reunión (SharePoint Stream)',
      url: 'https://example.com/stream/como-convocar-una-reunion',
      filePath: null,
    },
  ],
  versions: [
    { version: 'v1.0', date: '2025-07-20', author: 'G. Administrativa', reason: 'Versión inicial de la política.' },
    { version: 'v2.0', date: '2026-01-15', author: 'Moisés', reason: 'Se hace obligatoria la grabación de toda reunión.' },
  ],
},
  publication: {
    version: 'v2.1',
    effectiveDate: '2026-06-02',
    author: 'Moisés',
    reason: 'Se agrega el protocolo de cierre de las sesiones.',
  },
};

// El mockup marca tres políticas como Confidencial o Restringida; la v1 solo maneja Pública e Interna.
// El mockup solo trae título, estado, versión y fecha de estas políticas: el resto es contenido de muestra.
const catalog: CatalogEntry[] = [
  {
    title: 'Política de Comunicación y Gestión de Cambios',
    department: 'Gerencia Administrativa',
    type: 'infographic',
    classification: 'internal',
    status: 'active',
    version: 'v1.3',
    effectiveDate: '2026-09-01',
    nextReviewDate: '2027-09-01',
    owner: 'Coordinación Administrativa',
    summary: 'Todo cambio de proceso, sistema o responsable se comunica por los canales oficiales antes de entrar en vigencia.',
    objective: 'Asegurar que ningún cambio operativo tome por sorpresa a las áreas afectadas y que quede registro de qué cambió, desde cuándo y quién lo aprobó.',
    indicators: '% de cambios comunicados antes de su vigencia · incidentes causados por cambios no comunicados.',
    relatedDocuments: 'Políticas de Reuniones Virtuales con Gerencia Administrativa',
    guidelines: [
      {
        title: 'Aviso previo',
        body: 'Todo cambio se anuncia con al menos cinco días hábiles de anticipación, indicando qué cambia, a quién afecta y desde qué fecha.',
      },
      {
        title: 'Canales oficiales',
        body: 'La comunicación se hace por correo institucional y por la suite; los mensajes en chats personales no cuentan como aviso.',
      },
      {
        title: 'Responsable del cambio',
        body: 'Cada cambio tiene un responsable que atiende dudas y confirma que las áreas afectadas recibieron el aviso.',
      },
    ],
    previousVersions: [
      { version: 'v1.0', date: '2025-03-10', author: 'Coordinación Administrativa', reason: 'Versión inicial.' },
    ],
    changeReason: 'Se agrega el plazo mínimo de aviso previo.',
  },
  {
    title: 'Política de solicitudes de compra y aprobación',
    department: 'Compras e Importaciones',
    type: 'policy',
    classification: 'internal',
    status: 'active',
    version: 'v2.0',
    effectiveDate: '2026-04-12',
    nextReviewDate: '2027-04-12',
    owner: 'Coordinación de Compras',
    summary: 'Toda compra inicia con una solicitud aprobada por la jefatura del área y la Coordinación de Compras antes de emitir la orden.',
    objective: 'Ordenar el flujo de compras para que cada gasto tenga un solicitante, una aprobación y una orden de compra que lo respalde.',
    indicators: 'Tiempo de ciclo de la solicitud · % de compras con orden emitida antes de la factura.',
    relatedDocuments: 'Procedimiento de recepción en almacén · Lineamiento para compras internacionales',
    guidelines: [
      {
        title: 'Solicitud obligatoria',
        body: 'Ninguna compra se gestiona sin una solicitud registrada en la plantilla oficial, con cantidad, especificación y centro de costo.',
      },
      {
        title: 'Niveles de aprobación',
        body: 'La jefatura del área aprueba la necesidad y la Coordinación de Compras aprueba proveedor y precio; los montos mayores pasan a Gerencia.',
      },
      {
        title: 'Cotizaciones',
        body: 'Las compras no recurrentes requieren al menos tres cotizaciones comparables, que se adjuntan a la solicitud.',
      },
      {
        title: 'Orden de compra',
        body: 'El proveedor solo despacha contra una orden de compra firmada; las facturas sin orden no se tramitan.',
      },
    ],
    previousVersions: [
      { version: 'v1.0', date: '2024-08-01', author: 'Coordinación de Compras', reason: 'Versión inicial.' },
    ],
    changeReason: 'Se agregan los niveles de aprobación por monto.',
  },
  {
    title: 'Procedimiento de recepción en almacén',
    department: 'Compras e Importaciones',
    type: 'procedure',
    classification: 'internal',
    status: 'active',
    version: 'v1.4',
    effectiveDate: '2026-07-03',
    nextReviewDate: '2027-07-03',
    owner: 'Coordinación de Compras',
    summary: 'La mercadería se recibe comparándola contra la orden de compra y se confirma en el sistema el mismo día.',
    objective: 'Garantizar que lo recibido coincide con lo comprado en cantidad, especificación y estado antes de ingresarlo al inventario.',
    indicators: '% de recepciones confirmadas el mismo día · diferencias detectadas contra la orden de compra.',
    relatedDocuments: 'Política de solicitudes de compra y aprobación · Acta de recepción de mercadería',
    guidelines: [
      {
        title: 'Verificación contra la orden',
        body: 'El encargado de almacén compara cada bulto contra la orden de compra antes de firmar el documento del transportista.',
      },
      {
        title: 'Diferencias y daños',
        body: 'Los faltantes, sobrantes o daños se anotan en el acta de recepción y se reportan a Compras el mismo día.',
      },
      {
        title: 'Confirmación en el sistema',
        body: 'La recepción se registra en el sistema el mismo día para que el inventario y Contabilidad trabajen con datos reales.',
      },
    ],
    previousVersions: [
      { version: 'v1.0', date: '2024-11-15', author: 'Coordinación de Compras', reason: 'Versión inicial.' },
    ],
    changeReason: 'Se aclara el manejo de diferencias y daños.',
  },
  {
    title: 'Lineamiento para compras internacionales',
    department: 'Compras e Importaciones',
    type: 'guideline',
    classification: 'internal',
    status: 'under-review',
    version: 'v3.0',
    effectiveDate: '2026-10-28',
    nextReviewDate: '2027-10-28',
    owner: 'Compras Internacionales',
    summary: 'Criterios para cotizar, negociar y dar seguimiento a las importaciones con proveedores del exterior.',
    objective: 'Reducir riesgos de costo, plazo y calidad en las importaciones mediante criterios comunes de selección y seguimiento.',
    indicators: 'Cumplimiento de fechas de embarque · variación entre costo estimado y costo final de importación.',
    relatedDocuments: 'Política de solicitudes de compra y aprobación',
    guidelines: [
      {
        title: 'Selección de proveedor',
        body: 'Todo proveedor nuevo del exterior se evalúa por referencias, capacidad y condiciones de pago antes de la primera orden.',
      },
      {
        title: 'Términos de negociación',
        body: 'Cada orden deja por escrito el incoterm, la forma de pago, la fecha de embarque y las penalidades por atraso.',
      },
      {
        title: 'Seguimiento del embarque',
        body: 'Compras Internacionales actualiza el estado de cada embarque semanalmente hasta su ingreso al almacén.',
      },
    ],
    previousVersions: [
      { version: 'v2.0', date: '2025-05-20', author: 'Compras Internacionales', reason: 'Se incorpora la evaluación de proveedores nuevos.' },
    ],
    changeReason: 'Revisión general de términos de negociación.',
  },
  {
    title: 'Instructivo: cargar inventario de proveedor',
    department: 'Compras e Importaciones',
    type: 'instruction',
    classification: 'public',
    status: 'active',
    version: 'v1.1',
    effectiveDate: '2026-09-05',
    nextReviewDate: '2027-09-05',
    owner: 'Coordinación de Compras',
    summary: 'Pasos para cargar el inventario de un proveedor con la plantilla oficial.',
    objective: 'Que cualquier persona del equipo pueda cargar el inventario de un proveedor sin errores de formato.',
    indicators: 'Cargas rechazadas por errores de formato.',
    relatedDocuments: 'Plantilla carga inventario de proveedor',
    guidelines: [
      {
        title: 'Descargar la plantilla',
        body: 'Usa siempre la última versión de la plantilla publicada en los formatos del departamento; no reutilices archivos anteriores.',
      },
      {
        title: 'Completar los datos',
        body: 'Llena un producto por fila, con código, descripción, unidad y existencia; no cambies el nombre ni el orden de las columnas.',
      },
      {
        title: 'Cargar y validar',
        body: 'Sube el archivo en el sistema, revisa el resumen de la carga y corrige las filas marcadas con error antes de confirmar.',
      },
    ],
    previousVersions: [
      { version: 'v1.0', date: '2025-10-02', author: 'Coordinación de Compras', reason: 'Versión inicial.' },
    ],
    changeReason: 'Se actualizan los pasos a la nueva plantilla.',
  },
  {
    title: 'Política de resguardo documental de activos',
    department: 'Soporte Técnico y Activos Fijos',
    type: 'policy',
    classification: 'internal',
    status: 'under-review',
    version: 'v1.2',
    effectiveDate: '2025-01-10',
    nextReviewDate: '2026-01-10',
    owner: 'Jefatura de Activos Fijos',
    summary: 'Cada activo fijo conserva su expediente de compra, asignación y mantenimiento en el repositorio institucional.',
    objective: 'Asegurar que la documentación de cada activo esté completa y disponible para auditorías, garantías y bajas.',
    indicators: '% de activos con expediente completo · tiempo de respuesta a solicitudes de documentación.',
    relatedDocuments: 'Baja y traspaso de activos fijos',
    guidelines: [
      {
        title: 'Expediente por activo',
        body: 'Todo activo tiene un expediente con factura, acta de asignación, garantía y registros de mantenimiento.',
      },
      {
        title: 'Repositorio único',
        body: 'Los expedientes se guardan en el repositorio institucional; no se aceptan copias únicas en equipos personales.',
      },
      {
        title: 'Actualización',
        body: 'El expediente se actualiza cada vez que el activo cambia de responsable, de ubicación o recibe mantenimiento.',
      },
    ],
    previousVersions: [
      { version: 'v1.0', date: '2023-06-05', author: 'Jefatura de Activos Fijos', reason: 'Versión inicial.' },
    ],
    changeReason: 'Se define el repositorio único.',
  },
  {
    title: 'Baja y traspaso de activos fijos',
    department: 'Soporte Técnico y Activos Fijos',
    type: 'procedure',
    classification: 'internal',
    status: 'active',
    version: 'v2.2',
    effectiveDate: '2026-07-14',
    nextReviewDate: '2027-07-14',
    owner: 'Jefatura de Activos Fijos',
    summary: 'Toda baja o traspaso de un activo se solicita, se autoriza y se registra antes de mover el equipo.',
    objective: 'Mantener el inventario de activos fijos al día y con un responsable identificado para cada equipo.',
    indicators: 'Diferencias en el inventario físico anual · traspasos registrados a tiempo.',
    relatedDocuments: 'Política de resguardo documental de activos',
    guidelines: [
      {
        title: 'Solicitud',
        body: 'La jefatura del área solicita la baja o el traspaso indicando el activo, el motivo y el nuevo responsable o destino.',
      },
      {
        title: 'Autorización',
        body: 'Activos Fijos valida el estado del equipo y la Gerencia autoriza las bajas antes de cualquier movimiento.',
      },
      {
        title: 'Registro',
        body: 'El movimiento se registra en el sistema y se firma el acta correspondiente el mismo día en que se entrega el equipo.',
      },
    ],
    previousVersions: [
      { version: 'v2.0', date: '2025-02-11', author: 'Jefatura de Activos Fijos', reason: 'Se separa el flujo de bajas del de traspasos.' },
    ],
    changeReason: 'Se agrega la firma del acta el mismo día.',
  },
  {
    title: 'Política de manejo de información confidencial',
    department: 'Legal',
    type: 'policy',
    classification: 'internal',
    status: 'active',
    version: 'v3.0',
    effectiveDate: '2026-03-22',
    nextReviewDate: '2027-03-22',
    owner: 'Dirección Legal',
    summary: 'La información confidencial del grupo se comparte solo con quien la necesita para su trabajo y por canales autorizados.',
    objective: 'Proteger la información sensible del grupo, de sus colaboradores y de sus clientes frente a divulgaciones no autorizadas.',
    indicators: 'Incidentes de divulgación reportados · colaboradores con acuerdo de confidencialidad firmado.',
    relatedDocuments: 'Política de contratación y terminación',
    guidelines: [
      {
        title: 'Necesidad de conocer',
        body: 'La información confidencial se comparte únicamente con las personas que la requieren para cumplir sus funciones.',
      },
      {
        title: 'Canales autorizados',
        body: 'Se usa el correo y el almacenamiento institucional; está prohibido enviar información confidencial a cuentas personales.',
      },
      {
        title: 'Terceros',
        body: 'Antes de compartir información con un proveedor o aliado debe existir un acuerdo de confidencialidad firmado.',
      },
      {
        title: 'Reporte de incidentes',
        body: 'Toda pérdida o divulgación indebida se reporta a Legal de inmediato.',
      },
    ],
    previousVersions: [
      { version: 'v2.0', date: '2024-09-30', author: 'Dirección Legal', reason: 'Se incorpora el manejo con terceros.' },
    ],
    changeReason: 'Se agrega el reporte de incidentes.',
  },
  {
    title: 'Política de contratación y terminación',
    department: 'Talento Humano',
    type: 'policy',
    classification: 'internal',
    status: 'active',
    version: 'v4.1',
    effectiveDate: '2026-02-18',
    nextReviewDate: '2027-02-18',
    owner: 'Gerencia de Talento Humano',
    summary: 'Reglas para solicitar una plaza, contratar personal y formalizar la terminación de una relación laboral.',
    objective: 'Unificar el proceso de ingreso y salida de personal para que sea ordenado, justo y conforme a la ley.',
    indicators: 'Tiempo de cobertura de plazas · % de salidas con entrega completa de puesto.',
    relatedDocuments: 'Política de manejo de información confidencial',
    guidelines: [
      {
        title: 'Solicitud de plaza',
        body: 'Toda contratación parte de una requisición aprobada, con perfil del puesto y presupuesto confirmado.',
      },
      {
        title: 'Selección',
        body: 'El proceso incluye entrevista con Talento Humano y con la jefatura del área, y verificación de referencias.',
      },
      {
        title: 'Ingreso',
        body: 'Nadie inicia labores sin contrato firmado, expediente completo e inducción programada.',
      },
      {
        title: 'Terminación',
        body: 'Toda salida se formaliza con Talento Humano, incluye la entrega del puesto y la devolución de equipos y accesos.',
      },
    ],
    previousVersions: [
      { version: 'v4.0', date: '2025-04-07', author: 'Gerencia de Talento Humano', reason: 'Se agrega la inducción obligatoria.' },
    ],
    changeReason: 'Se detalla la devolución de equipos y accesos.',
  },
  {
    title: 'Protocolo de rendición de caja chica',
    department: 'Finanzas y Tesorería',
    type: 'procedure',
    classification: 'internal',
    status: 'under-review',
    version: 'v2.0',
    effectiveDate: '2025-08-08',
    nextReviewDate: '2026-08-08',
    owner: 'Tesorería',
    summary: 'Los fondos de caja chica se rinden con comprobantes válidos dentro del plazo establecido.',
    objective: 'Controlar el uso de los fondos de caja chica y asegurar que cada gasto quede respaldado.',
    indicators: 'Rendiciones presentadas a tiempo · gastos rechazados por falta de comprobante.',
    relatedDocuments: 'Política de solicitudes de compra y aprobación',
    guidelines: [
      {
        title: 'Gastos permitidos',
        body: 'La caja chica cubre gastos menores y urgentes de operación; no sustituye el proceso de compras.',
      },
      {
        title: 'Comprobantes',
        body: 'Cada gasto se respalda con factura a nombre de la empresa; los gastos sin comprobante no se reembolsan.',
      },
      {
        title: 'Plazo de rendición',
        body: 'El custodio rinde el fondo al agotarse el porcentaje acordado o al cierre de mes, lo que ocurra primero.',
      },
    ],
    previousVersions: [
      { version: 'v1.0', date: '2023-10-12', author: 'Tesorería', reason: 'Versión inicial.' },
    ],
    changeReason: 'Se fija el plazo de rendición.',
  },
  {
    title: 'Política de uso de vehículos de la empresa',
    department: 'Flota Vehicular',
    type: 'policy',
    classification: 'internal',
    status: 'active',
    version: 'v1.5',
    effectiveDate: '2026-05-30',
    nextReviewDate: '2027-05-30',
    owner: 'Jefatura de Flota',
    summary: 'Los vehículos de la empresa se usan solo para fines de trabajo, con bitácora de salida y responsable asignado.',
    objective: 'Cuidar la flota, reducir riesgos en carretera y tener trazabilidad de quién usa cada vehículo.',
    indicators: 'Incidentes de tránsito · mantenimientos preventivos realizados a tiempo.',
    relatedDocuments: 'Baja y traspaso de activos fijos',
    guidelines: [
      {
        title: 'Uso autorizado',
        body: 'Los vehículos se usan únicamente para actividades de la empresa y por conductores con licencia vigente.',
      },
      {
        title: 'Bitácora',
        body: 'Cada salida se registra con conductor, destino, kilometraje y nivel de combustible.',
      },
      {
        title: 'Mantenimiento e incidentes',
        body: 'El conductor reporta fallas y accidentes el mismo día; el mantenimiento preventivo se respeta según calendario.',
      },
    ],
    previousVersions: [
      { version: 'v1.0', date: '2024-02-19', author: 'Jefatura de Flota', reason: 'Versión inicial.' },
    ],
    changeReason: 'Se agrega el registro de combustible en la bitácora.',
  },
  {
    title: 'Lineamiento de pauta en redes sociales',
    department: 'Marketing y Desarrollo Digital',
    type: 'guideline',
    classification: 'internal',
    status: 'active',
    version: 'v1.0',
    effectiveDate: '2026-09-11',
    nextReviewDate: '2027-09-11',
    owner: 'Coordinación de Marketing',
    summary: 'Criterios para planificar, aprobar y medir la pauta pagada en redes sociales.',
    objective: 'Que la inversión en pauta responda a objetivos claros y sus resultados se midan de la misma forma en todas las marcas.',
    indicators: 'Costo por resultado · cumplimiento del presupuesto mensual de pauta.',
    relatedDocuments: 'Política de Comunicación y Gestión de Cambios',
    guidelines: [
      {
        title: 'Planificación',
        body: 'Cada campaña define objetivo, público, presupuesto y fechas antes de activarse.',
      },
      {
        title: 'Aprobación',
        body: 'Las piezas y el presupuesto se aprueban por la Coordinación de Marketing; ninguna pauta se activa sin esa aprobación.',
      },
      {
        title: 'Medición',
        body: 'Al cierre de cada campaña se entrega un reporte con alcance, resultados y costo por resultado.',
      },
    ],
    previousVersions: [],
    changeReason: 'Versión inicial.',
  },
  {
    title: 'Política de auditoría interna recurrente',
    department: 'Auditoría y Control Interno',
    type: 'policy',
    classification: 'internal',
    status: 'active',
    version: 'v2.0',
    effectiveDate: '2026-06-16',
    nextReviewDate: '2027-06-16',
    owner: 'Jefatura de Auditoría',
    summary: 'Las áreas se auditan según el calendario anual y atienden los hallazgos en el plazo acordado.',
    objective: 'Verificar de forma periódica que los procesos se ejecutan según las políticas y corregir a tiempo las desviaciones.',
    indicators: 'Cumplimiento del plan anual de auditoría · hallazgos cerrados dentro del plazo.',
    relatedDocuments: 'Política de resguardo documental de activos · Protocolo de rendición de caja chica',
    guidelines: [
      {
        title: 'Plan anual',
        body: 'Auditoría publica cada año el calendario de revisiones y lo comunica a las áreas.',
      },
      {
        title: 'Acceso a la información',
        body: 'Las áreas entregan la documentación solicitada en el plazo indicado en el aviso de auditoría.',
      },
      {
        title: 'Hallazgos y seguimiento',
        body: 'Cada hallazgo tiene un responsable y una fecha de cierre; Auditoría da seguimiento hasta su corrección.',
      },
    ],
    previousVersions: [
      { version: 'v1.0', date: '2024-06-03', author: 'Jefatura de Auditoría', reason: 'Versión inicial.' },
    ],
    changeReason: 'Se agrega el seguimiento de hallazgos.',
  },
  {
    title: 'Procedimiento de despliegue en producción',
    department: 'Tecnología y Desarrollo',
    type: 'procedure',
    classification: 'internal',
    status: 'active',
    version: 'v3.4',
    effectiveDate: '2026-11-01',
    nextReviewDate: '2027-11-01',
    owner: 'Jefatura de Tecnología',
    summary: 'Todo cambio pasa por revisión y pruebas antes de publicarse en los sistemas en producción.',
    objective: 'Reducir fallas en los sistemas del grupo asegurando que cada cambio esté revisado, probado y pueda revertirse.',
    indicators: 'Despliegues revertidos · incidentes causados por cambios.',
    relatedDocuments: 'Política de Comunicación y Gestión de Cambios',
    guidelines: [
      {
        title: 'Revisión de código',
        body: 'Ningún cambio llega a producción sin la revisión de otra persona del equipo.',
      },
      {
        title: 'Pruebas',
        body: 'El cambio se valida en el ambiente de pruebas con los casos acordados antes de programar el despliegue.',
      },
      {
        title: 'Ventana y aviso',
        body: 'Los despliegues se hacen en la ventana acordada y se avisa a las áreas usuarias cuando hay impacto.',
      },
      {
        title: 'Plan de reversión',
        body: 'Cada despliegue documenta cómo volver a la versión anterior y quién decide hacerlo.',
      },
    ],
    previousVersions: [
      { version: 'v3.0', date: '2025-09-15', author: 'Jefatura de Tecnología', reason: 'Se hace obligatoria la revisión de código.' },
    ],
    changeReason: 'Se agrega el plan de reversión.',
  },
];

export const policies: SeedPolicy[] = [virtualMeetingsPolicy, ...catalog.map(catalogPolicy)];

const purchasing = 'Compras e Importaciones';

export const departmentProcesses: ProcessInput[] = [
  {
    department: purchasing,
    name: 'Solicitud de compra',
    steps: 'Solicitante\nJefe de área\nCoordinación de Compras\nGerencia',
  },
  { department: purchasing, name: 'Emisión de OC', steps: 'Compras\nFirmas digitales\nProveedor' },
  {
    department: purchasing,
    name: 'Recepción en almacén',
    steps: 'Transporte\nAlmacén\nComparar contra la OC\nConfirmar',
  },
];

const sampleFormat = (name: string, file: string): FormatInput => ({
  department: purchasing,
  name,
  url: `https://example.com/formatos/${file}`,
  filePath: null,
});

export const departmentFormats: FormatInput[] = [
  sampleFormat('Plantilla solicitud de compra interna', 'solicitud-de-compra.xlsx'),
  sampleFormat('Plantilla carga inventario de proveedor', 'carga-inventario-proveedor.xlsx'),
  sampleFormat('Acta de recepción de mercadería', 'acta-de-recepcion.docx'),
  sampleFormat('Checklist auditoría de proveedor', 'checklist-auditoria-proveedor.pdf'),
];

const sampleLink = (label: string, path: string): LinkInput => ({
  department: purchasing,
  label,
  url: `https://example.com/${path}`,
});

export const departmentLinks: LinkInput[] = [
  sampleLink('Fastbi · Tablero de Compras', 'fastbi/tablero-compras'),
  sampleLink('Fastbi · Órdenes de compra', 'fastbi/ordenes-de-compra'),
  sampleLink('Fastbi · Recepciones', 'fastbi/recepciones'),
  sampleLink('Fastbi · Inventario de proveedores', 'fastbi/inventario-proveedores'),
  sampleLink('SharePoint · Facturas pendientes', 'sharepoint/facturas-pendientes'),
];

export const departmentNotices: NoticeInput[] = [
  {
    department: purchasing,
    date: '2026-11-11',
    body: 'Nueva versión del procedimiento de recepción en almacén — revisar antes del 15/11.',
    kind: 'warning',
  },
  {
    department: purchasing,
    date: '2026-11-05',
    body: 'Reunión semanal de Compras cambia a los martes 8:00 am.',
    kind: 'info',
  },
];
