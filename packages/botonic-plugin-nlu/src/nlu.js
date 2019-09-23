import { default as fetch } from 'node-fetch'
import { resolveEnv, loadOption } from './utils'
import { detectLang } from '@botonic/nlu/lib/preprocessing'
import {
  getIntent,
  getEntities,
  getPrediction
} from '@botonic/nlu/lib/prediction'
import { isProd } from './utils'
global.fetch = fetch

export class NLU {
  constructor(languages) {
    return (async () => {
      this.env = await resolveEnv()
      this.languages = []
      this.models = {}
      if (!isProd()) {
        window.models = {}
      }
      for (let language of languages) {
        this.languages.push(language)
        let { nluData, model } = loadOption(language, this.env)
        this.models[language] = {
          language,
          model,
          nluData
        }
      }
      await Promise.all([
        ...Object.values(this.models).map(nlu => nlu.model),
        ...Object.values(this.models).map(nlu => nlu.nluData)
      ])
      for (let [language, res] of Object.entries(this.models)) {
        let model = await res.model
        let nluData = await res.nluData
        let { intentsDict, maxSeqLength, vocabulary, devEntities } =
          this.env.mode === 'node' ? nluData : nluData.data
        let results = {
          nluData: {
            language: res.language,
            intentsDict,
            maxSeqLength,
            vocabulary,
            devEntities
          },
          model
        }
        if (isProd()) {
          this.models[language] = results
        } else {
          window.models[language] = results
        }
      }
      return this
    })()
  }

  predict(input) {
    let models = isProd() ? this.models : window.models
    let language = detectLang(input, this.languages)
    let { model, nluData } = models[language]
    let prediction = getPrediction(input, model, nluData)
    let intent = getIntent(prediction, nluData.intentsDict, language)
    let entities = getEntities(input, nluData.devEntities)
    return { intent, entities }
  }
}
