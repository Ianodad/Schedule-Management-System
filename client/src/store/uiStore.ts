interface UiState {
  isConflictModalOpen: boolean
}

const state: UiState = {
  isConflictModalOpen: false,
}

export function getUiState(): UiState {
  return state
}

export function setConflictModalOpen(isOpen: boolean): void {
  state.isConflictModalOpen = isOpen
}
