/**
 * CRUD data service — routes operations through OData based on form data source.
 */

import type { ODataQueryOptions, ODataResult } from "@/types";
import type { FormDataSource } from "@/types/form";
import type { ODataService } from "@/services/d365/odataService";

export interface FormDataServiceDeps {
  readonly odata: ODataService;
}

export class FormDataService {
  private readonly deps: FormDataServiceDeps;

  constructor(deps: FormDataServiceDeps) {
    this.deps = deps;
  }

  async loadRecord(
    dataSource: FormDataSource,
    keys: Record<string, unknown>
  ): Promise<Record<string, unknown> | null> {
    if (dataSource.type !== "odata" || !dataSource.entitySet) {
      throw new Error(`Unsupported data source type: ${dataSource.type}`);
    }

    const filter = Object.entries(keys)
      .map(([k, v]) => `${k} eq '${String(v)}'`)
      .join(" and ");

    const result = await this.deps.odata.query(dataSource.entitySet, {
      filter,
      top: 1,
      crossCompany: true,
    });

    return (result as ODataResult<Record<string, unknown>>).value[0] ?? null;
  }

  async saveRecord(
    dataSource: FormDataSource,
    data: Record<string, unknown>,
    keys?: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    if (dataSource.type !== "odata" || !dataSource.entitySet) {
      throw new Error(`Unsupported data source type: ${dataSource.type}`);
    }

    if (keys && Object.keys(keys).length > 0) {
      // Update
      const keyParts = Object.entries(keys)
        .map(([k, v]) => `${k}='${String(v)}'`)
        .join(",");
      const odataPath = `${dataSource.entitySet}(${keyParts})`;
      await this.deps.odata.update([{ odataPath, updatedFieldValues: data }]);
      return { ...keys, ...data };
    }

    // Create
    return this.deps.odata.create(dataSource.entitySet, data);
  }

  async deleteRecord(
    dataSource: FormDataSource,
    keys: Record<string, unknown>
  ): Promise<void> {
    if (dataSource.type !== "odata" || !dataSource.entitySet) {
      throw new Error(`Unsupported data source type: ${dataSource.type}`);
    }

    const keyParts = Object.entries(keys)
      .map(([k, v]) => `${k}='${String(v)}'`)
      .join(",");
    await this.deps.odata.remove(`${dataSource.entitySet}(${keyParts})`);
  }

  async queryRecords(
    dataSource: FormDataSource,
    options?: ODataQueryOptions
  ): Promise<ODataResult<Record<string, unknown>>> {
    if (dataSource.type !== "odata" || !dataSource.entitySet) {
      throw new Error(`Unsupported data source type: ${dataSource.type}`);
    }

    return this.deps.odata.query<Record<string, unknown>>(dataSource.entitySet, options);
  }
}
