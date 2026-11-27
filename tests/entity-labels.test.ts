import { describe, expect, it } from 'vitest';
import {
  createFirstLabel,
  deleteDialogTitle,
  newEntityLabel,
  outcomeTitle,
  type EntityNames,
} from '../src/components/admin/entityLabels';

const app: EntityNames = { singular: 'aplicación', plural: 'aplicaciones', gender: 'f' };
const resource: EntityNames = { singular: 'recurso', plural: 'recursos', gender: 'm' };

describe('entityLabels', () => {
  it('concuerda el botón de crear con el género', () => {
    expect(newEntityLabel(app)).toBe('Nueva aplicación');
    expect(newEntityLabel(resource)).toBe('Nuevo recurso');
    expect(createFirstLabel(app)).toBe('Crea la primera');
    expect(createFirstLabel(resource)).toBe('Crea el primero');
  });

  it('titula la confirmación con verbo y objeto', () => {
    expect(deleteDialogTitle(app, 'Correo')).toBe('Eliminar la aplicación "Correo"');
    expect(deleteDialogTitle(resource, 'Manual')).toBe('Eliminar el recurso "Manual"');
  });

  it('titula el resultado con el participio en su género', () => {
    expect(outcomeTitle(app, 'created')).toBe('Aplicación creada');
    expect(outcomeTitle(resource, 'updated')).toBe('Recurso actualizado');
    expect(outcomeTitle(resource, 'deleted')).toBe('Recurso eliminado');
  });
});
