import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { getDb, moveRow, type Db, type SortableTable } from '../lib/db';
import { formats, links, notices, processes, toFormatInput, type ContentStore } from '../lib/departmentContent';
import { deleteUpload } from '../lib/uploads';
import { createDepartment, deleteDepartment, renameDepartment } from '../lib/departments';
import { departmentFormFields, formatFormFields, linkFormFields, noticeFormFields, processFormFields } from './formSchemas';
import { assertUnique, idInput, moveInput, notFound, resolveResourceSource } from './actionHelpers';

const withId = <Fields extends z.ZodRawShape>(fields: Fields) => z.object({ ...fields, id: idInput.shape.id });

function moveAction(table: SortableTable) {
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
  move: moveAction('department_processes'),
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
  move: moveAction('department_formats'),
};

const departmentLinks = {
  ...crudActions(linkFormFields, 'El enlace no existe.', links),
  move: moveAction('department_links'),
};

const departmentNotices = crudActions(noticeFormFields, 'El aviso no existe.', notices);

const DEPARTMENT_NOT_FOUND = 'El departamento no existe.';

const departments = {
  create: defineAction({
    accept: 'form',
    input: z.object(departmentFormFields),
    handler: async (form) => {
      assertUnique('departments', form);
      return createDepartment(getDb(), form.name);
    },
  }),
  update: defineAction({
    accept: 'form',
    input: withId(departmentFormFields),
    handler: async (form) => {
      assertUnique('departments', form, form.id);
      const renamed = renameDepartment(getDb(), form.id, form.name);
      if (!renamed) throw notFound(DEPARTMENT_NOT_FOUND);
      return renamed;
    },
  }),
  remove: defineAction({
    input: idInput,
    handler: async ({ id }) => {
      const result = deleteDepartment(getDb(), id);
      if (result.status === 'not-found') throw notFound(DEPARTMENT_NOT_FOUND);
      if (result.status === 'in-use') {
        throw new ActionError({
          code: 'CONFLICT',
          message: `No se puede eliminar «${result.name}»: ${result.usage} ${result.usage === 1 ? 'registro lo usa' : 'registros lo usan'} (contactos, políticas o contenido). Cámbialos de departamento o bórralos primero.`,
        });
      }
      return { ok: true };
    },
  }),
  move: moveAction('departments'),
};

export const departmentActions = {
  departments,
  departmentProcesses,
  departmentFormats,
  departmentLinks,
  departmentNotices,
};
