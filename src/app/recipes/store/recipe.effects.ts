import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { Store } from "@ngrx/store";
import { switchMap, map, withLatestFrom } from "rxjs";
import * as RecipeActions from './recipe.actions';
import { Recipe } from "../recipe.model";
import * as fromApp from '../../store/app.reducer';


@Injectable()
export class RecipeEffects {

    fetchRecipes = createEffect(() =>
        this.actions$.pipe(
            ofType(RecipeActions.FETCH_RECIPES),
            switchMap(() => {
                return this.http.get<Recipe[]>('https://ng-recipes-721eb-default-rtdb.firebaseio.com/recipes.json')
            }),
            map(recipes => {
                return recipes.map(recipe => {
                    return {
                        ...recipe,
                        ingredients: recipe.ingredients ? recipe.ingredients : []
                    }
                })
            }),
            map(recipes => { return new RecipeActions.SetRecipes(recipes) })
        )
    )

    storeRecipes = createEffect(() =>
        this.actions$.pipe(
            ofType(RecipeActions.STORE_RECIPES),
            withLatestFrom(this.store.select('recipes')),
            switchMap(([actionData, recipesState]) => {
                return this.http.put('https://ng-recipes-721eb-default-rtdb.firebaseio.com/recipes.json', recipesState.recipes)
            })
        ), { dispatch: false }
    )


    constructor(private actions$: Actions, private http: HttpClient, private store: Store<fromApp.AppState>) { }
}