import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Flex } from '@rebass/grid'
import { useWebchat } from './hooks'
import * as tf from '@tensorflow/tfjs'
import * as tfvis from '@tensorflow/tfjs-vis'
import { detectLang } from '@botonic/nlu/lib/preprocessing'
import {
  getIntent,
  getEntities,
  getPrediction
} from '@botonic/nlu/lib/prediction'

export const NluMetricsView = props => {
  tfvis.visor().close()
  const { webchatState, updateDevSettings } = props.webchatHooks || useWebchat()
  const [data, setData] = useState({ metrics: {} })
  const [currentLang, setCurrentLang] = useState('')
  const [input, setInput] = useState('')

  const loadNluData = async languages => {
    for (let lang of languages) {
      let nluDataUrl = `${window.location.href}${lang}`
      const resMetrics = await axios(`${nluDataUrl}/metrics.json`)
      data.metrics[lang] = resMetrics.data
      setData({
        metrics: data.metrics,
        languages: Object.keys(window.models)
      })
    }
  }

  useEffect(() => {
    // Right now, in this way we assure that the languages are available when rendering the component
    setTimeout(() => {
      let languages = Object.keys(window.models)
      loadNluData(languages)
    }, 1000)
  }, [])

  const toggleNluMetricsView = () => {
    updateDevSettings({
      ...webchatState.devSettings,
      showNluMetricsView: !webchatState.devSettings.showNluMetricsView
    })
  }
  const toXY = (v, i) => ({ x: i + 1, y: v })

  const plotModelSummary = () => {
    const modelInspectorSurface = {
      name: 'Model Summary',
      tab: 'Model Inspection'
    }
    tfvis.show.modelSummary(
      modelInspectorSurface,
      window.models[currentLang].model
    )
    tfvis.visor().setActiveTab('Model Inspection')
    tfvis.visor().open()
  }

  const plotAccuracy = () => {
    const accuracySurface = {
      name: 'Accuracy vs Validation Accuracy',
      tab: 'Acc vs. Val Acc'
    }
    const accData = data.metrics[currentLang].history.acc.map(toXY)
    const valAccData = data.metrics[currentLang].history.val_acc.map(toXY)
    const accValAccData = {
      values: [accData, valAccData],
      labels: ['Acc', 'Val Acc']
    }
    tfvis.render.linechart(accuracySurface, accValAccData, { zoomToFit: true })
    tfvis.visor().setActiveTab('Acc vs. Val Acc')
    tfvis.visor().open()
  }

  const plotLoss = () => {
    const lossSurface = {
      name: 'Loss vs Validation Loss',
      tab: 'Loss vs. Val Loss'
    }
    const lossData = data.metrics[currentLang].history.loss.map(toXY)
    const valLossData = data.metrics[currentLang].history.val_loss.map(toXY)
    const lossValLossData = {
      values: [lossData, valLossData],
      labels: ['Loss', 'Val Loss']
    }
    tfvis.render.linechart(lossSurface, lossValLossData, { zoomToFit: true })
    tfvis.visor().setActiveTab('Loss vs. Val Loss')
    tfvis.visor().open()
  }

  const testInput = () => {
    if (input !== '') {
      let detectedLang = detectLang(input, data.languages)
      console.log(detectedLang, 'detected')
      let prediction = getPrediction(
        input,
        window.models[detectedLang].model,
        window.models[detectedLang].nluData
      )
      let intent = getIntent(
        prediction,
        window.models[detectedLang].nluData.intentsDict,
        detectedLang
      )
      alert(JSON.stringify(intent))
    }
  }

  return (
    <Flex
      style={{
        position: 'absolute',
        top: 50,
        left: 0,
        width: 350,
        height: '100%',
        textAlign: 'center'
      }}
    >
      {webchatState.devSettings.showNluMetricsView ? (
        <Flex
          style={{
            background: '#0c2a34',
            alignItems: 'center',
            borderTopRightRadius: 5,
            borderBottomRightRadius: 5,
            flexDirection: 'column'
          }}
          width={1}
        >
          <h1
            style={{
              padding: 12,
              textAlign: 'center',
              color: 'white',
              borderBottom: '1px solid rgba(255, 255, 255, 0.3)',
              cursor: 'pointer',
              fontSize: 16,
              fontWeight: 10,
              fontFamily: 'Arial, Helvetica, sans-serif'
            }}
            onClick={toggleNluMetricsView}
          >
            Botonic NLU Metrics
          </h1>
          {Object.keys(window.models).length == 0 ? (
            <Flex
              flexDirection='column'
              style={{
                justifyContent: 'center'
              }}
              width={1}
            >
              <h3 style={{ color: 'white' }}>Loading NLU Data...</h3>
            </Flex>
          ) : (
            <>
              <Flex
                id={'nlu'}
                flexDirection={'column'}
                style={{ background: '#0c2a34' }}
              >
                <h3 style={{ color: 'green' }}>NLU Data Loaded</h3>
                <h4 style={{ color: 'white' }}>
                  lang: {currentLang == '' ? 'Select a Lang' : currentLang}
                </h4>
                <Flex justifyContent='center'>
                  {data.languages &&
                    data.languages.map((lang, i) => (
                      <button key={i} onClick={() => setCurrentLang(lang)}>
                        {lang}
                      </button>
                    ))}
                </Flex>
                <button onClick={() => plotModelSummary()}>
                  Model Summary
                </button>
                <button onClick={() => plotAccuracy()}>Accuracy Plot</button>
                <button onClick={() => plotLoss()}>Loss Plot</button>
                <h3 style={{ color: 'white' }}>Test your input:</h3>
                <input
                  type='text'
                  placeholder='Test input'
                  onChange={e => setInput(e.target.value)}
                />
                <button onClick={testInput}>Test!</button>
              </Flex>
            </>
          )}
        </Flex>
      ) : (
        <Flex
          style={{
            background:
              Object.keys(window.models).length == 0 &&
              data.languages &&
              Object.keys(data.languages)
                ? '#ff0000'
                : '#00ff00',
            justifyContent: 'center',
            width: 32,
            height: 30,
            borderTopRightRadius: 5,
            borderBottomRightRadius: 5,
            cursor: 'pointer'
          }}
          onClick={toggleNluMetricsView}
        >
          📊
        </Flex>
      )}
    </Flex>
  )
}
