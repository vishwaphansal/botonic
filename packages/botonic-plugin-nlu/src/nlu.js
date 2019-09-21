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
        let nluData = await res.nluData
        let { intentsDict, maxSeqLength, vocabulary, devEntities } =
          this.env.mode === 'node' ? nluData : nluData.data
        let model = await res.model
        // console.log('SAVING IN PLUGIN')
        // await model.save('localstorage://eng')
        if (!isProd()) {
          window.models[language].nluData = {
            language: res.language,
            intentsDict,
            maxSeqLength,
            vocabulary,
            devEntities
          }
        }
        this.models[language] = {
          nluData: {
            language: res.language,
            intentsDict,
            maxSeqLength,
            vocabulary,
            devEntities
          },
          model: model
        }
      }
      return this
    })()
  }

  async predict(input) {
    let models = null
    if (isProd()) {
      models = this.models
    } else {
      window.models.eng.model = await window.models.eng.model
      models = window.models
    }
    let language = detectLang(input, this.languages)
    let { model, nluData } = models[language]
    let prediction = getPrediction(input, model, nluData)
    let intent = getIntent(prediction, nluData.intentsDict, language)
    let entities = getEntities(input, nluData.devEntities)
    return { intent, entities }
  }
}
