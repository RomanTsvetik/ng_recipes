import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { LoggingService } from '../logging.service';
import { Ingredient } from '../shared/ingredient.model';
import { Store } from '@ngrx/store';
import * as ShoppingListActions from '../shopping-list/store/shopping-list.actions';
import * as fromApp from '../store/app.reducer'

@Component({
    selector: 'app-shopping-list',
    templateUrl: './shopping-list.component.html',
    styleUrls: ['./shopping-list.component.css']
})
export class ShoppingListComponent implements OnInit, OnDestroy {
    ingredients: Observable<{ ingredients: Ingredient[] }>;
    private igChangeSub: Subscription;

    constructor(
        private loggingService: LoggingService,
        private store: Store<fromApp.AppState>) { }

    ngOnInit() {
        this.ingredients = this.store.select('shoppingList')
        // this.ingredients = this.slService.getIngrediets()
        // this.igChangeSub = this.slService.ingredientsChanged.subscribe(
        //     (ingredients: Ingredient[]) => {
        //         this.ingredients = ingredients
        //     }
        // )

        this.loggingService.printLog('Hello from SL Comp')
    }

    onEditItem(index: number) {
        // this.slService.startedEditing.next(index);
        this.store.dispatch(new ShoppingListActions.StartEdit(index))
    }

    ngOnDestroy() {
        // this.igChangeSub.unsubscribe()
    }
}
