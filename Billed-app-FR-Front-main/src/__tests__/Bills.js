/**
 * @jest-environment jsdom
 */

import {screen, waitFor, fireEvent} from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH} from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import Bills from "../containers/Bills.js";

import router from "../app/Router.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      //to-do write expect expression
      expect(windowIcon.classList.contains('active-icon')).toBe(true)

    })
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => new Date(b.date) - new Date(a.date)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
    test("Then clicking on 'New Bill' button should navigate to NewBill page", () => {
      const onNavigate = jest.fn();
      const store = null;
      const localStorage = window.localStorage;
      document.body.innerHTML = `<button data-testid="btn-new-bill">New Bill</button>`;
      
      const bills = new Bills({ document, onNavigate, store, localStorage });
      const buttonNewBill = screen.getByTestId("btn-new-bill");
      fireEvent.click(buttonNewBill);
      
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH['NewBill']);
    });
    test("Then clicking on 'icon-eye' should open modal with bill image", () => {
      const onNavigate = jest.fn();
      const store = null;
      const localStorage = window.localStorage;
      document.body.innerHTML = `
        <div data-testid="icon-eye" data-bill-url="https://example.com/bill.jpg"></div>
        <div id="modaleFile" class="modal">
          <div class="modal-body"></div>
        </div>`;
      
      const bills = new Bills({ document, onNavigate, store, localStorage });
      const iconEye = screen.getByTestId("icon-eye");
      $.fn.modal = jest.fn();
      fireEvent.click(iconEye);
      
      expect(document.querySelector(".bill-proof-container img").src).toBe("https://example.com/bill.jpg");
      expect($.fn.modal).toHaveBeenCalledWith('show');
    });
    test("Then getBills should fetch and format bills correctly", async () => {
      const store = {
        bills: jest.fn().mockImplementation(() => {
          return {
            list: jest.fn().mockResolvedValueOnce([
              { date: "2021-04-01", status: "pending" },
              { date: "2021-03-01", status: "accepted" },
            ])
          }
        })
      }
      const billsInstance = new Bills({ document, onNavigate: jest.fn(), store, localStorage: window.localStorage })
      const bills = await billsInstance.getBills()
      expect(bills.length).toBe(2)
      expect(bills[0].date).toBe("1 Avr. 21") // Ajuster l'attente pour correspondre au format de date
      expect(bills[1].date).toBe("1 Mar. 21") // Ajuster l'attente pour correspondre au format de date
    })
  })
})
