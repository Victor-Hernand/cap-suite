export type EntityGender = 'm' | 'f';

export interface EntityNames {
  singular: string;
  plural: string;
  gender: EntityGender;
}

export type EntityOutcome = 'created' | 'updated' | 'deleted';

const PARTICIPLE_STEMS: Record<EntityOutcome, string> = {
  created: 'cread',
  updated: 'actualizad',
  deleted: 'eliminad',
};

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

const genderEnding = (entity: EntityNames) => (entity.gender === 'f' ? 'a' : 'o');

/** «Nueva aplicación», «Nuevo recurso». */
export function newEntityLabel(entity: EntityNames): string {
  return `Nuev${genderEnding(entity)} ${entity.singular}`;
}

/** «Crea la primera», «Crea el primero». */
export function createFirstLabel(entity: EntityNames): string {
  return entity.gender === 'f' ? 'Crea la primera' : 'Crea el primero';
}

/** «Eliminar la aplicación "Correo"». */
export function deleteDialogTitle(entity: EntityNames, recordLabel: string): string {
  const article = entity.gender === 'f' ? 'la' : 'el';
  return `Eliminar ${article} ${entity.singular} "${recordLabel}"`;
}

/** «Aplicación creada», «Recurso eliminado». */
export function outcomeTitle(entity: EntityNames, outcome: EntityOutcome): string {
  return `${capitalize(entity.singular)} ${PARTICIPLE_STEMS[outcome]}${genderEnding(entity)}`;
}
