import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { getDb, moveRow, type Db, type SortableTable } from '../lib/db';
import { formats, links, notices, processes, toFormatInput, type ContentStore } from '../lib/departmentContent';
import { deleteUpload } from '../lib/uploads';
import { formatFormFields, linkFormFields, noticeFormFields, processFormFields } from './formSchemas';
import { idInput, moveInput, notFound, resolveResourceSource } from './actionHelpers';

const withId = <Fields extends z.ZodRawShape>(fields: Fields) => z.object({ ...fields, id: idInput.shape.id });

function moveWithinDepartment(table: SortableTable) {
  return defineAction({
    input: moveInput,
    handler: async ({ id, direction }) => {
      moveRow(getDb(), table, id, direction);
      return { ok: true };
    },
  });
}

function removeRow(deleteRow: (db: Db, id: number) => unknown) {
  return defineAction({
    input: idInput,
    handler: async ({ id }) => {
      deleteRow(getDb(), id);
      return { ok: true };
    },
  });
}

/** Crear, editar y eliminar para el contenido sin archivos; el esquema ya garantiza la forma de Input. */
function crudActions<Input extends object>(formFields: z.ZodRawShape, notFoundMessage: string, store: ContentStore<Input>) {
  return {
    create: defineAction({
      accept: 'form',
      input: z.object(formFields),
      handler: async (form) => store.create(getDb(), form as Input),
    }),
    update: defineAction({
      accept: 'form',
      input: withId(formFields),
      handler: async (form) => {
        const { id, ...fields } = form as Input & { id: number };
        if (!store.get(getDb(), id)) throw notFound(notFoundMessage);
        return store.update(getDb(), id, fields as Input);
      },
    }),
    remove: removeRow(store.delete),
  };
}

const departmentProcesses = {
  ...crudActions(processFormFields, 'El proceso no existe.', processes),
  move: moveWithinDepartment('department_processes'),
};

const departmentFormats = {
  create: defineAction({
    accept: 'form',
    input: z.object(formatFormFields),
    handler: async (form) => {
      const source = await resolveResourceSource(form, undefined, 'El formato', 'policies');
      return formats.create(getDb(), toFormatInput(form, source));
    },
  }),
  update: defineAction({
    accept: 'form',
    input: withId(formatFormFields),
    handler: async (form) => {
      const existing = formats.get(getDb(), form.id);
      if (!existing) throw notFound('El formato no existe.');
      const source = await resolveResourceSource(form, existing, 'El formato', 'policies');
      return formats.update(getDb(), form.id, toFormatInput(form, source));
    },
  }),
  remove: defineAction({
    input: idInput,
    handler: async ({ id }) => {
      const deleted = formats.delete(getDb(), id);
      if (deleted?.filePath) deleteUpload(deleted.filePath);
      return { ok: true };
    },
  }),
  move: moveWithinDepartment('department_formats'),
};

const departmentLinks = {
  ...crudActions(linkFormFields, 'El enlace no existe.', links),
  move: moveWithinDepartment('department_links'),
};

const departmentNotices = crudActions(noticeFormFields, 'El aviso no existe.', notices);

export const departmentActions = {
  departmentProcesses,
  departmentFormats,
  departmentLinks,
  departmentNotices,
};
