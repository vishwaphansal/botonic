import * as contentful from 'contentful'

import * as cms from '../../cms'
import { CmsException, Context, OnFinish } from '../../cms'
import { TopContentDelivery } from '../content-delivery'
import { DeliveryApi } from '../delivery-api'
import {
  addCustomFields,
  CommonEntryFields,
  ContentfulEntryUtils,
} from '../delivery-utils'
import { getTargetCallback } from './callback-delivery'
import { CarouselFields } from './carousel'
import { HandoffFields } from './handoff'
import { ImageFields } from './image'
import { TextFields } from './text'

export class InputDelivery extends TopContentDelivery {
  constructor(delivery: DeliveryApi, resumeErrors: boolean) {
    super(cms.ContentType.INPUT, delivery, resumeErrors)
  }

  async input(id: string, context: Context): Promise<cms.Input> {
    const entry: contentful.Entry<InputFields> = await this.getEntry(
      id,
      context
    )
    return this.fromEntry(entry, context)
  }

  fromEntry(entry: contentful.Entry<InputFields>, context: Context) {
    const fields = entry.fields
    const common = ContentfulEntryUtils.commonFieldsFromEntry(entry)
    return addCustomFields(
      new cms.Input(
        common,
        fields.shortText,
        fields.keywords,
        this.target(entry, context)
      ),
      entry.fields
    )
  }

  private target(
    entry: contentful.Entry<InputFields>,
    context: cms.Context
  ): OnFinish {
    if (!entry.fields.target) {
      throw new CmsException(`Input ${this.entryId(entry)} has no target`)
    }
    return getTargetCallback(entry.fields.target, context)
  }
}

export interface InputFields extends CommonEntryFields {
  input: string
  shortText: string
  keywords: string[]
  target: InputTarget
}

export type InputTarget = contentful.Entry<
  CarouselFields | TextFields | ImageFields | HandoffFields
>
