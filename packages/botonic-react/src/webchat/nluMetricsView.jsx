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
  const [data, setData] = useState({ metrics: {}, model: {}, nluData: {} })
  const [input, setInput] = useState('')

  const toggleNluMetricsView = () => {
    updateDevSettings({
      ...webchatState.devSettings,
      showNluMetricsView: !webchatState.devSettings.showNluMetricsView
    })
  }
  const toXY = (v, i) => ({ x: i + 1, y: v })
  const loadNluData = async () => {
    let nluDataUrl = `${window.location.href}eng`
    const resMetrics = await axios(`${nluDataUrl}/metrics.json`)
    const resNluData = await axios(`${nluDataUrl}/nlu-data.json`)
    const resModel = await window.models.eng.model
    setData({
      ...resMetrics.data,
      nluData: resNluData.data,
      model: resModel
    })
  }

  useEffect(() => {
    loadNluData()
  }, [])

  const plotModelSummary = () => {
    const modelInspectorSurface = {
      name: 'Model Summary',
      tab: 'Model Inspection'
    }
    tfvis.show.modelSummary(modelInspectorSurface, data.model)
    tfvis.visor().setActiveTab('Model Inspection')
    tfvis.visor().toggle()
  }

  const plotAccuracy = () => {
    const accuracySurface = {
      name: 'Accuracy vs Validation Accuracy',
      tab: 'Acc vs. Val Acc'
    }
    const accData = data.history.acc.map(toXY)
    const valAccData = data.history.val_acc.map(toXY)
    const accValAccData = {
      values: [accData, valAccData],
      labels: ['Acc', 'Val Acc']
    }
    tfvis.render.linechart(accuracySurface, accValAccData, { zoomToFit: true })
    tfvis.visor().setActiveTab('Acc vs. Val Acc')
    tfvis.visor().toggle()
  }

  const plotLoss = () => {
    const lossSurface = {
      name: 'Loss vs Validation Loss',
      tab: 'Loss vs. Val Loss'
    }
    const lossData = data.history.loss.map(toXY)
    const valLossData = data.history.val_loss.map(toXY)
    const lossValLossData = {
      values: [lossData, valLossData],
      labels: ['Loss', 'Val Loss']
    }
    tfvis.render.linechart(lossSurface, lossValLossData, { zoomToFit: true })
    tfvis.visor().setActiveTab('Loss vs. Val Loss')
    tfvis.visor().toggle()
  }
  const testInput = () => {
    const inputObj = {
      'Test input': input
    }
    if (input !== '') {
      let prediction = getPrediction(input, data.model, data.nluData)
      let intent = getIntent(prediction, data.nluData.intentsDict, 'eng')
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
          {Object.keys(data.model).length == 0 ? (
            <Flex
              style={{
                justifyContent: 'center'
              }}
              width={1}
            >
              <h3 style={{ color: 'red' }}>Data not loaded</h3>
            </Flex>
          ) : (
            <>
              <Flex
                id={'nlu'}
                flexDirection={'column'}
                style={{ background: '#0c2a34' }}
              >
                <h3 style={{ color: 'green' }}>NLU Data Loaded</h3>
                <button onClick={() => plotModelSummary()}>
                  Model Summary
                </button>
                <button onClick={() => plotAccuracy()}>Accuracy Plot</button>
                <button onClick={() => plotLoss()}>Loss Plot</button>
                <hr />
                <input
                  type='text'
                  placeholder='Test input'
                  onChange={e => setInput(e.target.value)}
                />
                <button onClick={testInput}>Submit</button>
              </Flex>
            </>
          )}
        </Flex>
      ) : (
        <Flex
          style={{
            background:
              Object.keys(data.model).length == 0 ? '#ff0000' : '#00ff00',
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
