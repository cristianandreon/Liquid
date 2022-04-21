/*
 * Copyright (c) Cristian Andreon - cristianandreon.eu - 2022.
 */

package com.liquid;

import com.google.gson.ExclusionStrategy;
import com.google.gson.FieldAttributes;

public class GSonExclusionStrategy implements ExclusionStrategy {

    @Override
    public boolean shouldSkipField(FieldAttributes fieldAttributes) {
        return fieldAttributes.getName().endsWith("&changed"); // || f.getName().equalsIgnoreCase("comp_thumb");
        // return false;
    }

    @Override
    public boolean shouldSkipClass(Class<?> clazz) {
        return clazz.getName().endsWith("&changed"); // || f.getName().equalsIgnoreCase("comp_thumb");
        // return false;
    }
}
