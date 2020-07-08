//DATA CONTROLLER: data module
var budgetController = (function () { //budgetController is a module
    //function constructors that sets up a prototype object for incomes and expenses
    var Expense = function(id, description, value) {
        this.id = id;
        this.description = description;
        this.value = value;
        this.percentage = -1; //setting percentage to empty until it is calculated by the method
    };

    //method prototype attached to every Expense object that calculates its % of total income
    Expense.prototype.calcPercentage = function(totalIncome) {
        if (totalIncome > 0){
            this.percentage = Math.round((this.value / totalIncome) * 100);
        } else {
            this.percentage = -1;
        }
    };

    //method prototype to return the percentage calculation
    Expense.prototype.getPercentage = function() {
        return this.percentage;
    };

    var Income = function (id, description, value) {
        this.id = id;
        this.description = description;
        this.value = value;
    };

    //function to calculate total of expenses or income (written here because will feed into the data object)
    var calculateTotal = function (type) {
        //get the exp and inc arrays and loop over them to get their sums
        var sum = 0;
        data.allItems[type].forEach(function(cur) {
            sum += cur.value;
        });
        data.totals[type] = sum;
    };

    //create an object that houses all data (the arrays where all new expense and income objects are stored)
    var data = {
        //nest objects within objects to create better organized subcategories of data variables
        allItems: {
            exp: [],
            inc: []
        },
        totals : {
            exp: 0,
            inc: 0
        },
        budget : 0,
        percentage: -1      //-1 is used to denote something that is nonexistant
    }

    //method to create new expense and income objects, as entered by the user
    return { 
         addItem : function(type, des, val) {
            var newItem, ID;

            //if/else statement controls for the error of when the array is empty and length - 1 = -1 (which is impossible)
            if (data.allItems[type].length > 0) {
                //each new item's ID should be +1 of the ID of the last item in the specific inc or exp array
                ID = data.allItems[type][data.allItems[type].length - 1].id + 1;
            } else {
                ID = 0;
            }
            
            if (type === 'exp') {
                newItem = new Expense(ID, des, val);
            } else if (type === 'inc') {
                newItem = new Income(ID, des, val); 
            }
            //adds new item to the data array, classified by its type (exp or inc)
            data.allItems[type].push(newItem);
            //return the newItem so the other module/function that calls this method can have direct access to it
            return newItem;
        },

        //method to delete income/expense items when user clicks x button
        deleteItem : function(type, id) { //pass type and id because that's how we will pinpoint the item 
        var ids, index;
        //calling the item via data.allItems[type][id] does not work because the item id may not be in order of their index
        //use map() to find the index position of the item (type+id) that is to be deleted
            ids = data.allItems[type].map(function(current) {
                return current.id; //returns new array with the ids i.e. [1,4,5,7]
        });
            //stores item's index
            index = ids.indexOf(id);
            //delete if index is not empty (-1)
            if (index !== -1) {
                data.allItems[type].splice(index, 1);
            }
        },

        //method to calculate the budget
        calculateBudget: function () {
            //calculate total income and expenses
            calculateTotal('exp');
            calculateTotal('inc');
            //calculate budget (income - expenses)
            data.budget = data.totals.inc - data.totals.exp; 
            //calculate the percentage of income that we spent (expenses)
            if (data.totals.inc > 0) { //if/else condition protects against a 0 denominator
                data.percentage = Math.round((data.totals.exp / data.totals.inc)*100);
            } else {
                data.percentage = -1;
            }
        },

        //method to calculate percentage of expense to income
        calculatePercentages: function() {
            //loops over expense array and runs calcPercentage method on every item (does not return anything)
            data.allItems.exp.forEach(function(cur) {
                cur.calcPercentage(data.totals.inc);
            });
        },

        //method to return percentage of expense to income
        getPercentages: function() {
            //loops over expense array and returns a new array with all the percentages of every item
            var allPerc = data.allItems.exp.map(function(cur) {
                 return cur.getPercentage();
            });
            return allPerc; //array with all of the percentages
        },

        //method to return or get the budget
        getBudget: function() {
            //when returning multiple values list them together as an object
            return {
                budget: data.budget,
                totalInc: data.totals.inc,
                totalExp: data.totals.exp,
                percentage: data.percentage
            }
        },

        testing : function () {
            console.log(data);
        }
    }
})();

//UI CONTROLLER: UI module
var UIController = (function () {
    //create an object to store the HTML class names as private variables in an object, so that if you change the class names later, or the UI all together, it doesn't break everything
    var DOMstrings = {
        inputType: '.add__type',
        inputDescription: '.add__description',
        inputValue: '.add__value',
        inputBtn: '.add__btn',
        incomeContainer: '.income__list',
        expensesContainer: '.expenses__list',
        budgetLabel: '.budget__value',
        incomeLabel: '.budget__income--value',
        expensesLabel: '.budget__expenses--value',
        percentageLabel: '.budget__expenses--percentage',
        container: '.container',
        expensesPercLabel: '.item__percentage',
        dateLabel: '.budget__title--month'
    }

    //format numbers to + 1,000.00 for expense or - 1,000.00 for expense
    var formatNumber= function(num, type) {
        var numSplit, int, dec, type;
        //format to absolute number
        num = Math.abs(num);
        //format to two decimal points
        num = num.toFixed(2);
        //split the num so you can add the comma
        numSplit = num.split('.');
        int = numSplit[0];
        dec = numSplit[1];
        if (int.length > 3) {
            int = int.substr(0, int.length - 3) + ',' + int.substr(int.length - 3, 3); // (index startingPosition, how many to splice)
        }
        //ternary if/else operator to assign + or - depending on the type inc or exp
        return (type === "exp" ? '-' : '+') + ' ' + int + '.' + dec;
    };

    //forEach loop written for node lists (reusable)
    var nodeListForEach = function (list, callback) {
        //each time you loop over the Node List, you call the callback function
        for (var i = 0; i < list.length; i++) {
            callback(list[i], i); //parameters are current and index of the fields list
        }
    };

    //function to read user inputted income and expenses from the UI
    //written as an object with a method because we want it to be publicly accessible to the controller module that calls it
    return {
        getInput : function() {
            return { //to retrieve all 3 values at once, put them into one object and list them as properties
                type: document.querySelector(DOMstrings.inputType).value, //value is drop down menu, will be either inc or exp
                description: document.querySelector(DOMstrings.inputDescription).value,
                value: parseFloat(document.querySelector(DOMstrings.inputValue).value)
            }
        },

        //function to display input items in the DOM
        addListItem : function(obj, type) {
            var html, newHtml, element;
            //1.create HTML string with placeholder text
            if (type ==='inc') {
                element = DOMstrings.incomeContainer;
                html = '<div class="item clearfix" id="inc-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
            } else if (type === 'exp'){
                element = DOMstrings.expensesContainer;
                html = '<div class="item clearfix" id="exp-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__percentage">21%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>'
                }
            //2. replace placeholder text with actual data
            newHtml = html.replace('%id%', obj.id);
            newHtml = newHtml.replace('%description%', obj.description);
            newHtml = newHtml.replace('%value%', formatNumber(obj.value, type));
            //3. insert HTML into the DOM
            document.querySelector(element).insertAdjacentHTML('beforeend', newHtml);
        },

        //function to display item deletions in the DOM
        deleteListItem: function(selectorID) {
            //move up one level to the parent to remove its child
            var el = document.getElementById(selectorID);
            el.parentNode.removeChild(el);
        },

        //function to clear the input fields after the user presses enter or clicks submit button
        clearFields : function() {
            var fields, fieldsArr;
            fields = document.querySelectorAll(DOMstrings.inputDescription + ', ' + DOMstrings.inputValue);
            //how to convert the list returned from querySelectorAll into an array (create a copy of it as an array)
            fieldsArr = Array.prototype.slice.call(fields);
            //loop over the array with forEach method and perform the callback function to clear their values on it
            fieldsArr.forEach(function(current, index, array) {
                current.value = "";   
            });
            //set the focus back on the first field (description) after the inputs are cleared
            fieldsArr[0].focus();
        },

        //method to display the budget to the UI
        displayBudget: function(obj) { //obj is the object that contains the returned values from getBudget
            //define type to determine inc or exp display type for the budget's formatNumber function    
            var type;
            obj.budget > 0 ? type = 'inc' : type = 'exp';
            document.querySelector(DOMstrings.budgetLabel).textContent = formatNumber(obj.budget, type);
            document.querySelector(DOMstrings.incomeLabel).textContent = formatNumber(obj.totalInc, 'inc'); 
            document.querySelector(DOMstrings.expensesLabel).textContent = formatNumber(obj.totalExp, 'exp');
            //if/else condition to control for situations where income is 0 but expenses are entered 
            if (obj.percentage > 0) {
                document.querySelector(DOMstrings.percentageLabel).textContent = obj.percentage + '%';
            } else {
                document.querySelector(DOMstrings.percentageLabel).textContent = '--';
            }
        },

        //method to display percentages to the UI
        displayPercentages : function(percentages) {

            var fields = document.querySelectorAll(DOMstrings.expensesPercLabel); //returns a NodeList
            
            //the callback function used as a parameter inside the NodeList forEach function
            nodeListForEach(fields, function(current, index) {
                if (percentages[index] > 0) {
                //change the text content of each item to the value stored in the percentages array at index position 0, 1 etc
                    current.textContent = percentages[index] + '%';
                } else {
                    current.textContent = '--';
                }
            });
        },

        //method to display the current month
        displayMonth : function() {
            var now, year, month, months;
            now = new Date(); //pre-baked Date() Object Constructor

            months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            month = now.getMonth(); // getMonth() is a method of Date(), returns the index 5 for June
            year = now.getFullYear(); //getFullYear is a method of Date(), returns 2020
            document.querySelector(DOMstrings.dateLabel).textContent = months[month] + ' ' + year;
        },

        //method to change UX when minus is selected from dropdown (for expense input)
        changedType : function() {
            //select the three input fields that will receive a red-focus css class
            var fields = document.querySelectorAll(
                DOMstrings.inputType + ',' +
                DOMstrings.inputDescription + ',' +
                DOMstrings.inputValue);
            
            //loop over the input fields and toggle the red-focus css class on or off depending on if it is or isn't there
            nodeListForEach(fields, function(cur) {
                cur.classList.toggle('red-focus');
            });

            //toggle the red button on when expense selected
            document.querySelector(DOMstrings.inputBtn).classList.toggle('red');
        },

        //to make the private object DOMstrings accessible to the other modules, make it public by listing it as a method of the return object
        getDOMstrings : function() {
            return DOMstrings;  
        }
    }
})();

//CONTROLLER: connector module that connects the UI module with the data module
var controller = (function(budgetCtrl, UICtrl) { 

    //function to organize all event listeners in one place
    var setupEventListeners = function() {
        //pulls the DOMstrings variables into the controller
        var DOM = UICtrl.getDOMstrings();

        //add event listener for user clicking the button that adds an income or expense
        document.querySelector(DOM.inputBtn).addEventListener('click', ctrlAddItem);

        //add event listener for user pressing the return key (instead of clicking the button)
        document.addEventListener('keypress', function (event) {
            if (event.keyCode === 13 || event.which === 13) { //13 is key code for enter button
                ctrlAddItem();
            }
        })

        //add event listener for user deleting an income or expense item
        document.querySelector(DOM.container).addEventListener('click', ctrlDeleteItem);

        //add event listener for changing UX styling whenever user selects - for expense from dropdown
        document.querySelector(DOM.inputType).addEventListener('change', UICtrl.changedType);
    }; 

    //function to calculate, return and display the budget everytime a new income or expense is added/deleted
    var updateBudget = function() {
        // 1. Calculate the budget
        budgetCtrl.calculateBudget();
        // 2. Return the budget
        var budget = budgetCtrl.getBudget();
        // 3. Display the budget on the UI
        UICtrl.displayBudget(budget); //budget stores the returned values from budgetController.getBudget()
    };

    //function to calculate, return and display expense percentages 
    var updatePercentages = function () {

        // 1. Calculate percentages
        budgetCtrl.calculatePercentages();

        // 2. Read percentages from the budget controller
        var percentages = budgetCtrl.getPercentages();

        // 3. Update the UI with the new percentages
        UICtrl.displayPercentages(percentages);
    };

     
    //writing reusable function that calls all the functions related to getting calculating and displaying inputs
    var ctrlAddItem = function() {
        var input, newItem;
        // 1. Get the data inputted by the user
        input = UICtrl.getInput();

        //condition to prevent user from entering empty fields
        if (input.description !== "" && !isNaN(input.value) && input.value > 0){
            // 2. Add the item to the budget controller
            newItem = budgetCtrl.addItem(input.type, input.description, input.value);
            // 3. Add the new item to the UI
            UICtrl.addListItem(newItem, input.type);
            //4. Clear the fields
            UICtrl.clearFields();
            //5. Calculate and update budget
            updateBudget();
            //6. Calculate and update percentages
            updatePercentages();
        }      
    }

    //function that calls functions related to the user deleting an item
    var ctrlDeleteItem = function(event) {
        var itemID, splitID, type, ID;
        //find the parent-level html container of the event target with the ID (income-0) so you can retrieve it
        itemID = event.target.parentNode.parentNode.parentNode.parentNode.id;

        if (itemID) {
            //split the itemID 'inc-0' into its type and ID number by using the split method
            splitID = itemID.split('-');
            type = splitID[0];
            ID = parseInt(splitID[1]); //convert string to number to enable calcs

            //1.Delete the item from the data structure
            budgetCtrl.deleteItem(type, ID);
            //2. Delete the item from the UI
            UICtrl.deleteListItem(itemID);
            //3. Update and show the new budget
            updateBudget();
            //4. Calculate and update percentages
            updatePercentages();
        }
    }


    //public initialization function that calls the event listeners function
        return {
            init : function() {
                console.log('application has started');
                //to set the current date at start of app
                UICtrl.displayMonth();
                //to make sure budget displayed is 0 at app start, pass an object to displayBudget that is zeroed out
                UICtrl.displayBudget({
                    budget: 0,
                    totalInc: 0,
                    totalExp: 0,
                    percentage: -1
                }); 
                setupEventListeners();
            }
        };

})(budgetController, UIController); //passing other modules as parameters connects them all

//you must call the init function outside the controller IIFE body, or else nothing will happen
controller.init();



