import { CommonModule } from '@angular/common';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CUSTOM_ELEMENTS_SCHEMA, SchemaMetadata, Type } from '@angular/core';
import { TestModuleMetadata } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslateModule } from '@ngx-translate/core';

export const sharedComponentTestImports = [
  CommonModule,
  FormsModule,
  ReactiveFormsModule,
  HttpClientTestingModule,
  RouterTestingModule,
  TranslateModule.forRoot(),
];

export const sharedComponentTestSchemas: SchemaMetadata[] = [CUSTOM_ELEMENTS_SCHEMA];

export function buildComponentTestingModule<T>(
  component: Type<T>,
  metadata: TestModuleMetadata = {},
): TestModuleMetadata {
  return {
    declarations: [component, ...(metadata.declarations ?? [])],
    imports: [...sharedComponentTestImports, ...(metadata.imports ?? [])],
    providers: [...(metadata.providers ?? [])],
    schemas: [...sharedComponentTestSchemas, ...(metadata.schemas ?? [])],
  };
}

export function buildServiceTestingModule(
  metadata: TestModuleMetadata = {},
): TestModuleMetadata {
  return {
    imports: [
      HttpClientTestingModule,
      RouterTestingModule,
      TranslateModule.forRoot(),
      ...(metadata.imports ?? []),
    ],
    providers: [...(metadata.providers ?? [])],
  };
}
