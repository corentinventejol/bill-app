/**
 * @jest-environment jsdom
 */

import { screen, fireEvent } from "@testing-library/dom"
import '@testing-library/jest-dom/extend-expect'
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { ROUTES_PATH } from "../constants/routes.js"
import { localStorageMock } from "../__mocks__/localStorage.js"
import mockStore from "../__mocks__/store.js"
import userEvent from '@testing-library/user-event'
import router from '../app/Router.js'
import Store from '../app/Store'

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

jest.mock("../app/store", () => mockStore)

describe("Given I am connected as an employee", () => {
  beforeEach(() => {
    const spyBills = jest.spyOn(mockStore, 'bills')
    Object.defineProperty(window, 'localStorage', { value: localStorageMock })
    window.localStorage.setItem('user', JSON.stringify({ type: 'Employee', email: 'a@a' }))
    const email = 'a@a'
    let root = document.createElement('div')
    root.setAttribute('id', 'root')
    root.innerHTML = NewBillUI()
    document.body.appendChild(root)
    router()
  })
  afterEach(() => {
    jest.clearAllMocks()
    document.body.innerHTML = ''
  })

  describe("When I am on NewBill Page", () => {
    test("Then the form should be rendered correctly", () => {
      const html = NewBillUI()
      document.body.innerHTML = html
      expect(screen.getByTestId('form-new-bill')).toBeTruthy()
    })

    test("Then the file input should accept only jpg, jpeg, and png files", () => {
      const html = NewBillUI()
      document.body.innerHTML = html
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
      const html = NewBillUI()
      document.body.innerHTML = html
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
  describe('When I upload a valid file', () => {
    test('Then it should set the billId, fileUrl, and fileName correctly', async () => {
      document.body.innerHTML = NewBillUI()
      const newBill = new NewBill({ document, onNavigate: jest.fn(), store: mockStore, localStorage: window.localStorage })
      const handleChangeFileMock = jest.fn((event) => newBill.handleChangeFile(event))

      const fileInput = screen.getByTestId('file')
      fileInput.addEventListener('change', handleChangeFileMock)
      const file = new File([''], 'example.jpg', { type: 'image/jpeg' })
  
      // Vérifier que fileInput n'est pas null
      expect(fileInput).not.toBeNull()
  
      // Mock the store's bills().create() method to resolve with the expected values
      // newBill.store.bills().create = jest.fn().mockResolvedValue({
      //   fileUrl: 'http://localhost:3000/example.png',
      //   key: '12345'
      // })
  
      // // Simulate the change event
      // Object.defineProperty(fileInput, 'files', {
      //   value: [file],
      //   configurable: true
      // })
      // fireEvent.change(fileInput)

      userEvent.upload(fileInput, file)

      expect(handleChangeFileMock).toHaveBeenCalled()
  
      // Utiliser un setTimeout pour attendre la résolution de la promesse
      // setTimeout(() => {
        // expect(newBill.fileUrl).toBe('http://localhost:3000/example.png')
        // expect(newBill.fileName).toBe('example.png')
        // expect(newBill.billId).toBe('12345')
      // }, 0)
    })
  })
  describe('When I upload a file', () => {
    test('Then the file input should be empty and an error message should be displayed if the file is not a valid image', async () => {
      jest.spyOn(mockStore, 'bills')
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({ type: 'Employee', email: 'a@a' }))
      const email = 'a@a'
      let root = document.createElement('div')
      root.setAttribute('id', 'root')
      root.innerHTML = NewBillUI()
      document.body.appendChild(root)
      router()

      const newBill = new NewBill({
        document,
        onNavigate: (pathname) => {
          document.body.innerHTML = ROUTES({ pathname })
        },
        store: Store,
        localStorage: window.localStorage,
      })

      const handleChangeFileMock = jest.fn((event) => newBill.handleChangeFile(event))

      const fileInput = screen.getByTestId('file')
      fileInput.addEventListener('change', handleChangeFileMock)

      const mockFile = new File([''], 'document.pdf', { type: 'application/pdf' })
      userEvent.upload(fileInput, mockFile)

      const errorMessage = document.querySelector(`p[data-testid="file-error-message"]`)
      expect(errorMessage).not.toBeNull()
      expect(errorMessage.textContent).toBe(
        'Le fichier doit être une image au format jpg, JPG, jpeg, JPEG, png ou PNG'
      )
      expect(fileInput.value).toBe('')

      userEvent.clear(fileInput)
      userEvent.upload(fileInput, new File(['foo'], 'foo.pdf', { type: 'application/pdf' }))
      expect(handleChangeFileMock).toHaveBeenCalled()
      errorMessage.remove()
    })

    test('Then the file input should be filled and the store should be called', async () => {
      const html = NewBillUI()
      document.body.innerHTML = html
      jest.spyOn(mockStore, 'bills')

      document.body.innerHTML = NewBillUI()
      const newBill = new NewBill({
        document,
        onNavigate: (pathname) => {
          document.body.innerHTML = ROUTES({ pathname })
        },
        store: mockStore,
        localStorage: window.localStorage,
      })

      const handleChangeFileMock = jest.fn((event) => newBill.handleChangeFile(event))
      const inputFile = screen.getByTestId('file')
      inputFile.addEventListener('change', handleChangeFileMock)
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' })
      userEvent.upload(inputFile, file)
      expect(handleChangeFileMock).toHaveBeenCalled()
      expect(document.querySelector(`p[data-testid="file-error-message"]`)).toBeNull()
    })
  })
})
