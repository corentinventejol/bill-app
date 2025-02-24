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
      const newBill = new NewBill({
        document,
        onNavigate: jest.fn(),
        store: {
          bills: () => ({
            create: jest.fn().mockResolvedValue({
              fileUrl: 'http://localhost:3000/image.png',
              key: '1234'
            })
          })
        },
        localStorage: window.localStorage
      })
  
      const file = new File(['test'], 'test.png', { type: 'image/png' })
      const event = {
        preventDefault: jest.fn(),
        target: {
          value: 'C:\\fakepath\\test.png',
          files: [file]
        }
      }
  
      newBill.handleChangeFile(event)
      await new Promise(process.nextTick)
  
      expect(newBill.billId).toBe('1234')
      expect(newBill.fileUrl).toBe('http://localhost:3000/image.png')
      expect(newBill.fileName).toBe('test.png')
    })
    test("Then it should handle 404 error when store.bills().create fails", async () => {
      document.body.innerHTML = NewBillUI()
      console.error = jest.fn()

      const newBill = new NewBill({
        document,
        onNavigate: jest.fn(),
        store: {
          bills: () => ({
            create: jest.fn().mockRejectedValue(new Error('Error 404'))
          })
        },
        localStorage: window.localStorage
      })

      const file = new File(['test'], 'test.png', { type: 'image/png' })
      const event = {
        preventDefault: jest.fn(),
        target: {
          value: 'C:\\fakepath\\test.png',
          files: [file]
        }
      }

      newBill.handleChangeFile(event)
      await new Promise(process.nextTick)

      expect(console.error).toHaveBeenCalledWith(new Error('Error 404'))
    })

    test("Then it should handle 500 error when store.bills().create fails", async () => {
      document.body.innerHTML = NewBillUI()
      console.error = jest.fn()

      const newBill = new NewBill({
        document,
        onNavigate: jest.fn(),
        store: {
          bills: () => ({
            create: jest.fn().mockRejectedValue(new Error('Error 500'))
          })
        },
        localStorage: window.localStorage
      })

      const file = new File(['test'], 'test.png', { type: 'image/png' })
      const event = {
        preventDefault: jest.fn(),
        target: {
          value: 'C:\\fakepath\\test.png',
          files: [file]
        }
      }

      newBill.handleChangeFile(event)
      await new Promise(process.nextTick)

      expect(console.error).toHaveBeenCalledWith(new Error('Error 500'))
    })
  })
})
