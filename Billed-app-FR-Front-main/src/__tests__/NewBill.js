/**
 * @jest-environment jsdom
 */

import { screen, fireEvent } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { ROUTES_PATH } from "../constants/routes.js"
import { localStorageMock } from "../__mocks__/localStorage.js"
import mockStore from "../__mocks__/store.js"



jest.mock("../app/store", () => mockStore)

describe("Given I am connected as an employee", () => {
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', { value: localStorageMock })
    window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))
    document.body.innerHTML = NewBillUI()
  })

  describe("When I am on NewBill Page", () => {
    test("Then the form should be rendered correctly", () => {
      expect(screen.getByTestId('form-new-bill')).toBeTruthy()
    })

    test("Then the file input should accept only jpg, jpeg, and png files", () => {
      const newBill = new NewBill({ document, onNavigate: jest.fn(), store: mockStore, localStorage: window.localStorage })
      const fileInput = screen.getByTestId('file')
      const handleChangeFile = jest.fn(newBill.handleChangeFile)
      fileInput.addEventListener('change', handleChangeFile)

      const file = new File(['dummy content'], 'example.pdf', { type: 'application/pdf' })
      fireEvent.change(fileInput, { target: { files: [file] } })
      expect(handleChangeFile).toHaveBeenCalled()
      expect(fileInput.value).toBe('')

      const validFile = new File(['dummy content'], 'example.png', { type: 'image/png' })
      fireEvent.change(fileInput, { target: { files: [validFile] } })
      expect(handleChangeFile).toHaveBeenCalled()
      expect(fileInput.files[0]).toBe(validFile)
    })

    test("Then the form submission should work correctly and navigate to the Bills page", () => {
      const onNavigate = jest.fn()
      const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage })
      const form = screen.getByTestId('form-new-bill')
      const handleSubmit = jest.fn(newBill.handleSubmit)
      form.addEventListener('submit', handleSubmit)

      fireEvent.submit(form)
      expect(handleSubmit).toHaveBeenCalled()
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH['Bills'])
    })
  })
})
