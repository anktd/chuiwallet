/* eslint-disable @typescript-eslint/no-unused-vars */

/* eslint-disable no-unused-vars */
import { createSlice } from '@reduxjs/toolkit';

import { updateVersion } from '../global/actions';

export interface UIState {
  uiTxCreateScreen: {
    toInfo: {
      address: string;
      domain: string;
    };
    inputAmount: string;
    enableRBF: boolean;
    feeRate: number;
  };
}

export const initialState: UIState = {
  uiTxCreateScreen: {
    toInfo: {
      address: '',
      domain: ''
    },
    inputAmount: '',
    enableRBF: false,
    feeRate: 1
  }
};

const slice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    reset(state) {
      return initialState;
    },
    updateTxCreateScreen(
      state,
      action: {
        payload: {
          toInfo?: {
            address: string;
            domain: string;
          };
          inputAmount?: string;
          enableRBF?: boolean;
          feeRate?: number;
        };
      }
    ) {
      if (action.payload.toInfo !== undefined) {
        state.uiTxCreateScreen.toInfo = action.payload.toInfo;
      }
      if (action.payload.inputAmount !== undefined) {
        state.uiTxCreateScreen.inputAmount = action.payload.inputAmount;
      }
      if (action.payload.enableRBF !== undefined) {
        state.uiTxCreateScreen.enableRBF = action.payload.enableRBF;
      }
      if (action.payload.feeRate !== undefined) {
        state.uiTxCreateScreen.feeRate = action.payload.feeRate;
      }
    },
    resetTxCreateScreen(state) {
      state.uiTxCreateScreen = initialState.uiTxCreateScreen;
    }
  },
  extraReducers: (builder) => {
    builder.addCase(updateVersion, (state) => {
      // todo
      if (!state.uiTxCreateScreen) {
        state.uiTxCreateScreen = initialState.uiTxCreateScreen;
      }
    });
  }
});

export const uiActions = slice.actions;
export default slice.reducer;
