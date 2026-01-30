#!/usr/bin/env python3
"""
Diagnostic script to check Google Generative AI library capabilities
and identify the correct approach for setting thinking_budget.
"""

def check_library_version():
    """Check which Google GenAI libraries are installed and their versions."""
    print("=== Library Version Check ===")
    
    # Check google-generativeai
    try:
        import google.generativeai as genai
        print(f"(check) google-generativeai version: {genai.__version__}")
    except ImportError:
        print("(X) google-generativeai not installed")
    except AttributeError:
        print("(check) google-generativeai installed (version unknown)")
    
    # Check google-genai (new SDK)
    try:
        import google.genai as new_genai
        print(f"(check) google-genai version: {new_genai.__version__}")
    except ImportError:
        print("(X) google-genai (new SDK) not installed")
    except AttributeError:
        print("(check) google-genai (new SDK) installed (version unknown)")

def check_thinking_config_availability():
    """Check if ThinkingConfig is available in different locations."""
    print("\n=== ThinkingConfig Availability Check ===")
    
    try:
        import google.generativeai as genai
        from google.generativeai import types
        
        # Check if ThinkingConfig exists in types module
        if hasattr(types, 'ThinkingConfig'):
            print("(check) types.ThinkingConfig is available")
            try:
                config = types.ThinkingConfig(thinking_budget=0)
                print("(check) ThinkingConfig constructor works")
            except Exception as e:
                print(f"(X) ThinkingConfig constructor failed: {e}")
        else:
            print("(X) types.ThinkingConfig not found")
        
        # Check if ThinkingConfig exists in main genai module
        if hasattr(genai, 'ThinkingConfig'):
            print("(check) genai.ThinkingConfig is available")
        else:
            print("(X) genai.ThinkingConfig not found")
            
        # Check if thinking_budget is supported directly in GenerationConfig
        try:
            config = types.GenerationConfig(thinking_budget=0)
            print("(check) Direct thinking_budget parameter supported in GenerationConfig")
        except TypeError as e:
            print(f"(X) Direct thinking_budget parameter not supported: {e}")
            
    except ImportError as e:
        print(f"(X) Could not import google.generativeai: {e}")

def check_generation_config_attributes():
    """Check what attributes are available in GenerationConfig."""
    print("\n=== GenerationConfig Attributes ===")
    
    try:
        from google.generativeai import types
        
        # Create a basic GenerationConfig to see its attributes
        config = types.GenerationConfig()
        attributes = [attr for attr in dir(config) if not attr.startswith('_')]
        
        print("Available attributes in GenerationConfig:")
        for attr in sorted(attributes):
            print(f"  - {attr}")
            
        # Check specifically for thinking-related attributes
        thinking_attrs = [attr for attr in attributes if 'think' in attr.lower()]
        if thinking_attrs:
            print(f"\nThinking-related attributes found: {thinking_attrs}")
        else:
            print("\nNo thinking-related attributes found")
            
    except ImportError as e:
        print(f"(X) Could not check GenerationConfig attributes: {e}")

def suggest_solutions():
    """Provide specific solutions based on the diagnostic results."""
    print("\n=== Recommended Solutions ===")
    
    try:
        import google.generativeai as genai
        from google.generativeai import types
        
        # Try different approaches and report which ones work
        solutions = []
        
        # Solution 1: Direct thinking_budget
        try:
            config = types.GenerationConfig(thinking_budget=0)
            solutions.append("1. Use direct thinking_budget parameter in GenerationConfig")
        except:
            pass
            
        # Solution 2: ThinkingConfig in types
        try:
            config = types.GenerationConfig(
                thinking_config=types.ThinkingConfig(thinking_budget=0)
            )
            solutions.append("2. Use types.ThinkingConfig within GenerationConfig")
        except:
            pass
            
        # Solution 3: ThinkingConfig in main module
        try:
            config = types.GenerationConfig(
                thinking_config=genai.ThinkingConfig(thinking_budget=0)
            )
            solutions.append("3. Use genai.ThinkingConfig within GenerationConfig")
        except:
            pass
        
        if solutions:
            print("(check) Working solutions found:")
            for solution in solutions:
                print(f"  {solution}")
        else:
            print("(X) No working solutions found with current library version")
            print("  Recommended action: Update library or use new google-genai SDK")
            
    except ImportError:
        print("(X) google-generativeai not available")
        print("  Recommended action: Install google-genai (new SDK)")

def main():
    """Run all diagnostic checks."""
    print("Google Generative AI Library Diagnostic Tool")
    print("=" * 50)
    
    check_library_version()
    check_thinking_config_availability()
    check_generation_config_attributes()
    suggest_solutions()
    
    print("\n" + "=" * 50)
    print("Diagnostic complete. Use the results above to determine the correct approach.")

if __name__ == "__main__":
    main()
